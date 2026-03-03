
CREATE POLICY "Users can delete own sessions" ON public.interview_sessions FOR DELETE USING (auth.uid() = user_id);
