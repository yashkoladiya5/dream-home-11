import { ApiCheck, AssertionBuilder } from "checkly/constructs";

const leaderboardCheck = new ApiCheck("dream-home-11-leaderboard", {
  logicalId: "LeaderboardCheck",
  name: "Leaderboard API Check",
  activated: true,
  frequency: 2,
  frequencyUnit: "minutes",
  locations: ["us-east-1", "eu-west-1", "ap-south-1"],
  tags: ["production", "leaderboard", "api"],
  request: {
    method: "GET",
    url: "${BASE_URL}/api/v1/leaderboard",
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody("rankings").isArray(),
      AssertionBuilder.jsonBody("rankings").length().greaterThan(0),
      AssertionBuilder.jsonBody("rankings[0]").hasProperty("userId"),
      AssertionBuilder.jsonBody("rankings[0]").hasProperty("score"),
      AssertionBuilder.jsonBody("rankings[0]").hasProperty("rank"),
      AssertionBuilder.responseTime().lessThan(5000),
    ],
    basicAuthentication: undefined,
    queryParameters: [
      {
        key: "contestId",
        value: "${TEST_CONTEST_ID}",
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
  degradedResponseTime: 2000,
  maxResponseTime: 5000,
});

export default leaderboardCheck;
