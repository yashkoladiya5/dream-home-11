import { ApiCheck, AssertionBuilder } from "checkly/constructs";

const contestListCheck = new ApiCheck("dream-home-11-contest-list", {
  logicalId: "ContestListCheck",
  name: "Contest List API Check",
  activated: true,
  frequency: 2,
  frequencyUnit: "minutes",
  locations: ["us-east-1", "eu-west-1", "ap-south-1"],
  tags: ["production", "contests", "api"],
  request: {
    method: "GET",
    url: "${BASE_URL}/api/v1/contests",
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("contests").isArray(),
      AssertionBuilder.jsonBody("contests").length().greaterThan(0),
      AssertionBuilder.responseTime().lessThan(10000),
    ],
    basicAuthentication: undefined,
    queryParameters: [
      {
        key: "status",
        value: "upcoming",
      },
    ],
    body: undefined,
    bodyType: "JSON",
    headers: [],
    store: [],
  },
  groupSetupScript: undefined,
  groupTeardownScript: undefined,
  alertChannels: [
    {
      alertChannelId: "${SLACK_ALERT_CHANNEL_ID}",
      activated: true,
    },
  ],
  useGlobalAlertSettings: false,
  degradedResponseTime: 5000,
  maxResponseTime: 10000,
});

export default contestListCheck;
