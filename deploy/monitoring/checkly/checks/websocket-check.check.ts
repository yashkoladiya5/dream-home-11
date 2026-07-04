import { ApiCheck, AssertionBuilder } from "checkly/constructs";

const websocketCheck = new ApiCheck("dream-home-11-websocket", {
  logicalId: "WebSocketCheck",
  name: "WebSocket Connection Check",
  activated: true,
  frequency: 5,
  frequencyUnit: "minutes",
  locations: ["us-east-1"],
  tags: ["production", "websocket", "realtime"],
  request: {
    method: "GET",
    url: "${BASE_URL}/ws",
    headers: [
      {
        key: "Upgrade",
        value: "websocket",
      },
      {
        key: "Connection",
        value: "Upgrade",
      },
      {
        key: "Sec-WebSocket-Key",
        value: "dGhlIHNhbXBsZSBub25jZQ==",
      },
      {
        key: "Sec-WebSocket-Version",
        value: "13",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().oneOf([101, 200]),
      AssertionBuilder.responseTime().lessThan(10000),
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
  ],
  useGlobalAlertSettings: false,
  degradedResponseTime: 5000,
  maxResponseTime: 10000,
  environmentVariables: [
    {
      key: "BASE_URL",
      value: "${BASE_URL}",
      locked: true,
    },
  ],
});

export default websocketCheck;
