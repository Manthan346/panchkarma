-- ============================================================================
-- FIX: Allow Doctors to Respond to Feedback
-- ============================================================================
-- This fixes the error: "The result contains 0 rows" when doctors try to 
-- respond to patient feedback.
-- 
-- PROBLEM: The feedback_update policy only allows patients and admins to 
--          update feedback, but doctors need to respond too.
--
-- SOLUTION: Update the policy to allow doctors to update feedback as well.
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "feedback_update" ON feedback;

-- Create new policy that allows doctors to respond to feedback
CREATE POLICY "feedback_update" ON feedback
  FOR UPDATE USING (
    patient_id = auth.uid() OR
    public.get_user_role() IN ('admin', 'doctor')
  );

-- ============================================================================
-- DONE! Doctors can now respond to feedback.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ DOCTOR FEEDBACK RESPONSE - FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Doctors can now respond to patient feedback!';
  RAISE NOTICE '';
  RAISE NOTICE 'What changed:';
  RAISE NOTICE '  • Doctors can now UPDATE feedback records';
  RAISE NOTICE '  • This allows them to add admin_response';
  RAISE NOTICE '  • Patients can still update their own feedback';
  RAISE NOTICE '  • Admins can still update all feedback';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Try responding to feedback again - it should work now!';
  RAISE NOTICE '';
END $$;
