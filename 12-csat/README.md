## Snap-In for CSAT Surveys

This Snap-In does the following two things:
1) When a conversation resolves, it surfaces a survey on timeline as a comment
2) Accept survey response from user and stores it in DevRev SOR.

### Getting started with Survey Snap-In
1. Need to create survey schema for which response is taken using `surveys.create` DevRev API.
2. Snap-In require survey ID when created. This survey ID is used to validate the response against the survey schema.

# How to use the Snap-in
* After successfully deploying the snap-in, surveys will start surfacing when conversation is closed.

