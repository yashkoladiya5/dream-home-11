import { ApiCheck, AssertionBuilder } from "checkly/constructs";

const paymentFlowCheck = new ApiCheck("dream-home-11-payment-flow", {
  logicalId: "PaymentFlowCheck",
  name: "Payment Flow API Check",
  activated: true,
  frequency: 5,
  frequencyUnit: "minutes",
  locations: ["us-east-1"],
  tags: ["production", "payments", "api", "critical"],
  request: {
    method: "POST",
    url: "${BASE_URL}/api/v1/payments/order",
    headers: [
      {
        key: "Content-Type",
        value: "application/json",
      },
      {
        key: "Authorization",
        value: "Bearer ${TEST_AUTH_TOKEN}",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().oneOf([200, 401]),
      AssertionBuilder.responseTime().lessThan(10000),
    ],
    basicAuthentication: undefined,
    queryParameters: [],
    body: JSON.stringify({
      amount: 100,
      currency: "INR",
      paymentMethod: "test",
      description: "Checkly synthetic test payment",
    }),
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
      alertChannelId: "${PAGERDUTY_ALERT_CHANNEL_ID}",
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
    {
      key: "TEST_AUTH_TOKEN",
      value: "${TEST_AUTH_TOKEN}",
      locked: true,
    },
  ],
});

export default paymentFlowCheck;
