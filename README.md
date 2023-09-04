# learningStrategyTest
My debut full-stack project for neonlearner.com: A dynamic open-ended questionnaire designed to delve deep into users' study habits and gauge the efficacy of their learning strategies.


The project was created as a part of my initiative to make online learning more accessible to students by educating them on the effective learning strategies and independent learning capabilities. This test is a free introductory test for anyone who wishes to see how effective their current learning strategies are. The effectiveness score is calculated by comparing user response with the ideal learning methodologies grounded in the science of learning research. Users can also opt to receive detailed insights into their learning style, coupled with guidance on potential improvements.

Technically speaking, the frontend leverages HTML, CSS, and JavaScript, while the backend primarily utilizes the node.js runtime, hosted on AWS Lambda. The backend also interacts with AWS dynamoDB and SES services to fetch, record and send the required information. The connection between frontend and backend is established by HTTP API, provided by AWS API gateway service. The backend also makes API calls to OpenAI services.

I opted for a single Lambda instance deployment to streamline API gateway routing. Rather than setting up multiple routes, the Lambda function processes various request types embedded in the JSON string, decoded within the lambda event handler. While a more modular architecture was feasible, the web application's non-intensive nature negated the need for such complexity.


