## Google Play Store reviews to tickets

The snap-in provides a command `playstore_reviews_process` which allows you to fetch the last N reviews of your app (ID provided in the configuration of snap-in) and create tickets from them.
It categorizes each new ticket into one-of bug, feature_request, feedback, and question, and adds a corresponding tag on the ticket.

If it fails to categorize a ticket, it adds a tag `failed_to_infer_category`.

## Demo

[demo.webm](https://github.com/devrev/snap-in-examples/assets/32142363/1ba54b18-424f-4e5e-b150-da7c67e67d5e)
