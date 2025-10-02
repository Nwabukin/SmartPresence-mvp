# SmartPresence Backlog

This backlog captures deferred tasks to implement after the current MVP milestones.

## Biometric & Attendance Enhancements
- [ ] Add `biometric_events` audit table (event_id, user_id, purpose, s3_key, face_id, confidence, status, error_message, created_at)
- [ ] Add `biometric_enrolled_at TIMESTAMP NULL` to `student_profiles`
- [ ] Add `biometric_liveness_enabled BOOLEAN DEFAULT false` to `student_profiles`
- [ ] Add index on `student_profiles(rekognition_face_id)`
- [ ] Ensure unique constraint on `attendance_records(session_id, device_id)`
- [ ] Implement verification endpoints: presign selfie, Rekognition `SearchFacesByImage`, confidence threshold, return match result
- [ ] Add retry/backoff and clearer mobile error codes for biometrics

## Liveness Detection
- [ ] Integrate Rekognition Face Liveness (server-side): create Lambda/function, secure invocation, return liveness score
- [ ] Update mobile flow to require a successful liveness check for enrollment and attendance

## Amplify/Infra
- [ ] Document required env vars in backend: `AWS_REGION`, `S3_BUCKET`, `REKOG_COLLECTION_ID`, and AWS credentials setup
- [ ] Optionally move Rekognition calls into an Amplify Function (Lambda) and call via backend
- [ ] Add minimal IAM policies for S3 getObject/putObject and Rekognition operations for the backend environment

## Mobile App UX
- [ ] Improve enrollment UI: multi-step guidance, alignment hints, face bounding feedback
- [ ] Add attendance verification capture flow (camera → upload → verify → show confidence)
- [ ] Add a setting to re-enroll biometrics with confirmation flow

## Testing & Monitoring
- [ ] Seed test users, classes, sessions, and images for local verification
- [ ] Add integration tests for presign, upload, and indexing/verification flows
- [ ] Add logs/metrics for Rekognition latency, error rates, and confidence distributions


