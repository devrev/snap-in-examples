## Snap-In for CSAT Surveys

This Snap-In do following two things:
1) When conversation resolves surfaces Survey on timeline as comment
2) Accept survey response from user and stores it in DevRev SOR.

### Getting started with Survey Snap-In
1. Need to create survey schema for which response is taken using `surveys.create` DevRev API.
2. This Snap-In require connection for DevRev-PAT for calling internal APIs. 
3. Snap-In require survey ID when created. This survey ID is used to validate the response against the survey schema.

# How to use the Snap-in
* After successfully deploying the snap-in, surveys will start surfacing when conversation is closed.
  <img width="475" alt="Screenshot 2023-04-24 at 10 06 30 PM" src="https://user-images.githubusercontent.com/102597934/234070571-70891eec-ce07-4d14-baa3-f141122ce604.png">
* Once user select the response for the above survey response message will show up.
  <img width="464" alt="Screenshot 2023-04-24 at 10 06 39 PM" src="https://user-images.githubusercontent.com/102597934/234070602-fb27e7b7-d97c-4f5f-b1b6-46636dc2ed62.png">
