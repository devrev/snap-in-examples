## Google Playstore reviews to tickets

The Snap-in provides a command `playstore_reviews_process` which allows to fetch last N reviews of your app (id provided in the configuration of Snap-in) and create tickets out of them.
For each created ticket, it categorizes them into one-of bug, feature_request, feedback, and question, and adds a corresponding tag on the ticket.

If it fails to categorize a ticket, it adds a tag `failed_to_infer_category`.

## Demo

[Demo.webm](demo.webm)
