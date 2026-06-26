const List<String> restrictedStates = [
  'Assam',
  'Odisha',
  'Telangana',
];

const String restrictedStatesMessage = 'Withdrawals are not allowed from Assam, Odisha, and Telangana as per regulatory requirements.';

String? getRestrictedStateMessage(String? state) {
  if (state == null) return null;
  if (restrictedStates.contains(state)) {
    return 'Withdrawals are not allowed from $state as per regulatory requirements.';
  }
  return null;
}
