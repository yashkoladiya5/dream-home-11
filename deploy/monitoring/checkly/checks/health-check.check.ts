import { ApiCheck, AssertionBuilder } from "checkly/constructs";

const healthCheck = new ApiCheck("dream-home-11-health-check", {
  logicalId: "HealthCheck",
  name: "Health Check - Dream Home 11",
  activated: true,
  frequency: 1,
  frequencyUnit: "minutes",
  locations: ["us-east-1", "eu-west-1", "ap-south-1"],
  tags: ["production", "health", "critical"],
  request: {
    method: "GET",
    url: "${BASE_URL}/health",
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("status").equals("ok"),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
    basicAuthentication: undefined,
    queryParameters: [],
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
    {
      alertChannelId: "${EMAIL_ALERT_CHANNEL_ID}",
      activated: true,
    },
  ],
  useGlobalAlertSettings: false,
  degradedResponseTime: 2000,
  maxResponseTime: 5000,
});

export default healthCheck;
