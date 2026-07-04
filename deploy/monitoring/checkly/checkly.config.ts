import { Project } from "checkly/constructs";

const project = new Project("dream-home-11", {
  logicalId: "DreamHome11Project",
  name: "Dream Home 11",
  repoUrl: "https://github.com/dream-home-11/dream-home-11",
  activate: true,
  alertChannels: [
    {
      alertChannelId: "${SLACK_ALERT_CHANNEL_ID}",
      activated: true,
    },
    {
      alertChannelId: "${PAGERDUTY_ALERT_CHANNEL_ID}",
      activated: true,
    },
    {
      alertChannelId: "${EMAIL_ALERT_CHANNEL_ID}",
      activated: true,
    },
  ],
  tags: ["production", "fantasy-sports", "dream11"],
  runtimeId: "2024.02",
  preferredRegion: "us-east-1",
  enableScheduling: true,
  scheduleInterval: 1,
  scheduleCronExpression: "",
  locations: ["us-east-1", "eu-west-1", "ap-south-1"],
  muted: false,
  dashboardPause: false,
  apiCheckDefaults: {
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
    ],
    queryParameters: [],
    assertions: [],
    basicAuthentication: undefined,
    request: {
      method: "GET" as const,
      headers: [],
      queryParameters: [],
      body: undefined,
      store: [],
    },
  },
});

export default project;
