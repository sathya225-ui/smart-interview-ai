import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const conversationText = messages
      .map((m: { role: string; text: string }) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.text}`)
      .join("\n\n");

    const systemPrompt = `You are an expert HR interview coach. Analyze the following interview conversation for a ${difficulty}-level ${role} position and provide structured feedback.

You MUST respond with valid JSON only, no markdown, no code fences. Use this exact structure:
{
  "overallScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "performanceLabel": "<Strong/Good/Needs Improvement>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>", "<actionable tip 4>"]
}

Score guidelines:
- 85-100: Exceptional answers with specific examples, strong communication
- 70-84: Good answers, some areas could be more detailed
- 55-69: Adequate but lacking depth or specifics
- Below 55: Needs significant improvement

Be honest but encouraging. Base scores on actual answer quality, not just length.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here is the interview conversation:\n\n${conversationText}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from the response, handling possible markdown fences
    let feedback;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      feedback = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI feedback:", content);
      return new Response(JSON.stringify({ error: "Failed to parse feedback" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(feedback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
