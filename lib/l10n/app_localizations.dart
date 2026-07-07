import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Dream Home 11'**
  String get appName;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navContests.
  ///
  /// In en, this message translates to:
  /// **'Contests'**
  String get navContests;

  /// No description provided for @navWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get navWallet;

  /// No description provided for @navRewards.
  ///
  /// In en, this message translates to:
  /// **'Rewards'**
  String get navRewards;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @navMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get navMore;

  /// No description provided for @navViewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get navViewAll;

  /// No description provided for @commonLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get commonLoading;

  /// No description provided for @commonError.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get commonError;

  /// No description provided for @commonSomethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get commonSomethingWentWrong;

  /// No description provided for @commonRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get commonRetry;

  /// No description provided for @commonTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get commonTryAgain;

  /// No description provided for @commonDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get commonDone;

  /// No description provided for @commonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get commonCancel;

  /// No description provided for @commonConfirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get commonConfirm;

  /// No description provided for @commonSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get commonSave;

  /// No description provided for @commonClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get commonClose;

  /// No description provided for @commonBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get commonBack;

  /// No description provided for @commonNext.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get commonNext;

  /// No description provided for @commonSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get commonSubmit;

  /// No description provided for @commonSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get commonSkip;

  /// No description provided for @commonNoConnection.
  ///
  /// In en, this message translates to:
  /// **'No Connection'**
  String get commonNoConnection;

  /// No description provided for @commonSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get commonSearch;

  /// No description provided for @commonNoData.
  ///
  /// In en, this message translates to:
  /// **'No data available'**
  String get commonNoData;

  /// No description provided for @commonFailedToLoad.
  ///
  /// In en, this message translates to:
  /// **'Failed to load'**
  String get commonFailedToLoad;

  /// No description provided for @authGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get authGetStarted;

  /// No description provided for @authEnterMobile.
  ///
  /// In en, this message translates to:
  /// **'Enter Mobile'**
  String get authEnterMobile;

  /// No description provided for @authPhoneHint.
  ///
  /// In en, this message translates to:
  /// **'Provide a valid 10-digit number'**
  String get authPhoneHint;

  /// No description provided for @authGetOtp.
  ///
  /// In en, this message translates to:
  /// **'GET OTP'**
  String get authGetOtp;

  /// No description provided for @authEnterOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter OTP'**
  String get authEnterOtp;

  /// No description provided for @authResendOtp.
  ///
  /// In en, this message translates to:
  /// **'Resend OTP'**
  String get authResendOtp;

  /// No description provided for @authVerifyAndProceed.
  ///
  /// In en, this message translates to:
  /// **'VERIFY & PROCEED'**
  String get authVerifyAndProceed;

  /// No description provided for @authSelectLanguage.
  ///
  /// In en, this message translates to:
  /// **'Select Language'**
  String get authSelectLanguage;

  /// No description provided for @authEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get authEnglish;

  /// No description provided for @authHindi.
  ///
  /// In en, this message translates to:
  /// **'Hindi'**
  String get authHindi;

  /// No description provided for @authLogout.
  ///
  /// In en, this message translates to:
  /// **'LOGOUT'**
  String get authLogout;

  /// No description provided for @contestCreatePrivate.
  ///
  /// In en, this message translates to:
  /// **'Create Private Contest'**
  String get contestCreatePrivate;

  /// No description provided for @contestJoinWithCode.
  ///
  /// In en, this message translates to:
  /// **'Join with Code'**
  String get contestJoinWithCode;

  /// No description provided for @contestMyActiveContests.
  ///
  /// In en, this message translates to:
  /// **'My Active Contests'**
  String get contestMyActiveContests;

  /// No description provided for @contestEntryFee.
  ///
  /// In en, this message translates to:
  /// **'Entry Fee'**
  String get contestEntryFee;

  /// No description provided for @contestMaxSlots.
  ///
  /// In en, this message translates to:
  /// **'Max Slots'**
  String get contestMaxSlots;

  /// No description provided for @contestPrize.
  ///
  /// In en, this message translates to:
  /// **'Prize'**
  String get contestPrize;

  /// No description provided for @contestRules.
  ///
  /// In en, this message translates to:
  /// **'Rules'**
  String get contestRules;

  /// No description provided for @contestTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get contestTabAll;

  /// No description provided for @contestTabActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get contestTabActive;

  /// No description provided for @contestTabMega.
  ///
  /// In en, this message translates to:
  /// **'Mega'**
  String get contestTabMega;

  /// No description provided for @contestTabHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get contestTabHome;

  /// No description provided for @contestTabPast.
  ///
  /// In en, this message translates to:
  /// **'Past'**
  String get contestTabPast;

  /// No description provided for @contestSearch.
  ///
  /// In en, this message translates to:
  /// **'Search contests...'**
  String get contestSearch;

  /// No description provided for @contestTotalSlots.
  ///
  /// In en, this message translates to:
  /// **'Total Slots'**
  String get contestTotalSlots;

  /// No description provided for @contestFilled.
  ///
  /// In en, this message translates to:
  /// **'Filled'**
  String get contestFilled;

  /// No description provided for @contestJoinSuccess.
  ///
  /// In en, this message translates to:
  /// **'Joined Successfully!'**
  String get contestJoinSuccess;

  /// No description provided for @walletMyWallet.
  ///
  /// In en, this message translates to:
  /// **'My Wallet'**
  String get walletMyWallet;

  /// No description provided for @walletTotalBalance.
  ///
  /// In en, this message translates to:
  /// **'Total Balance'**
  String get walletTotalBalance;

  /// No description provided for @walletAddCash.
  ///
  /// In en, this message translates to:
  /// **'Add Cash'**
  String get walletAddCash;

  /// No description provided for @walletWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get walletWithdraw;

  /// No description provided for @walletRecentTransactions.
  ///
  /// In en, this message translates to:
  /// **'Recent Transactions'**
  String get walletRecentTransactions;

  /// No description provided for @walletSelectAmount.
  ///
  /// In en, this message translates to:
  /// **'Select Amount'**
  String get walletSelectAmount;

  /// No description provided for @walletEnterAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter Amount'**
  String get walletEnterAmount;

  /// No description provided for @walletPaymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get walletPaymentMethod;

  /// No description provided for @walletProceedToPay.
  ///
  /// In en, this message translates to:
  /// **'Proceed to Pay'**
  String get walletProceedToPay;

  /// No description provided for @walletDepositSuccessful.
  ///
  /// In en, this message translates to:
  /// **'Deposit Successful!'**
  String get walletDepositSuccessful;

  /// No description provided for @walletBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Bank Account'**
  String get walletBankAccount;

  /// No description provided for @walletUpi.
  ///
  /// In en, this message translates to:
  /// **'UPI'**
  String get walletUpi;

  /// No description provided for @walletAccountHolderName.
  ///
  /// In en, this message translates to:
  /// **'Account Holder Name'**
  String get walletAccountHolderName;

  /// No description provided for @walletAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get walletAccountNumber;

  /// No description provided for @walletIfscCode.
  ///
  /// In en, this message translates to:
  /// **'IFSC Code'**
  String get walletIfscCode;

  /// No description provided for @walletBankName.
  ///
  /// In en, this message translates to:
  /// **'Bank Name'**
  String get walletBankName;

  /// No description provided for @walletUpiId.
  ///
  /// In en, this message translates to:
  /// **'UPI ID'**
  String get walletUpiId;

  /// No description provided for @walletPts.
  ///
  /// In en, this message translates to:
  /// **'PTS'**
  String get walletPts;

  /// No description provided for @kycKycVerification.
  ///
  /// In en, this message translates to:
  /// **'KYC Verification'**
  String get kycKycVerification;

  /// No description provided for @kycKycStatus.
  ///
  /// In en, this message translates to:
  /// **'KYC Status'**
  String get kycKycStatus;

  /// No description provided for @kycVerified.
  ///
  /// In en, this message translates to:
  /// **'VERIFIED'**
  String get kycVerified;

  /// No description provided for @kycPending.
  ///
  /// In en, this message translates to:
  /// **'PENDING'**
  String get kycPending;

  /// No description provided for @kycRejected.
  ///
  /// In en, this message translates to:
  /// **'REJECTED'**
  String get kycRejected;

  /// No description provided for @kycCompleteYourKyc.
  ///
  /// In en, this message translates to:
  /// **'Complete Your KYC'**
  String get kycCompleteYourKyc;

  /// No description provided for @kycFullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get kycFullName;

  /// No description provided for @kycAadhaarNumber.
  ///
  /// In en, this message translates to:
  /// **'Aadhaar Number'**
  String get kycAadhaarNumber;

  /// No description provided for @kycPanNumber.
  ///
  /// In en, this message translates to:
  /// **'PAN Number'**
  String get kycPanNumber;

  /// No description provided for @kycSubmitKyc.
  ///
  /// In en, this message translates to:
  /// **'Submit KYC'**
  String get kycSubmitKyc;

  /// No description provided for @kycUploadDocuments.
  ///
  /// In en, this message translates to:
  /// **'Upload Documents'**
  String get kycUploadDocuments;

  /// No description provided for @rewardsCatalog.
  ///
  /// In en, this message translates to:
  /// **'Rewards Catalog'**
  String get rewardsCatalog;

  /// No description provided for @rewardsRedeemPoints.
  ///
  /// In en, this message translates to:
  /// **'Redeem points to claim real prizes'**
  String get rewardsRedeemPoints;

  /// No description provided for @rewardsPts.
  ///
  /// In en, this message translates to:
  /// **'PTS'**
  String get rewardsPts;

  /// No description provided for @rewardsRedeemReward.
  ///
  /// In en, this message translates to:
  /// **'Redeem Reward'**
  String get rewardsRedeemReward;

  /// No description provided for @rewardsConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Reward redeemed successfully!'**
  String get rewardsConfirmed;

  /// No description provided for @leaderboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Leaderboard'**
  String get leaderboardTitle;

  /// No description provided for @leaderboardTopPlayers.
  ///
  /// In en, this message translates to:
  /// **'Top Players'**
  String get leaderboardTopPlayers;

  /// No description provided for @leaderboardYourRank.
  ///
  /// In en, this message translates to:
  /// **'Your Rank'**
  String get leaderboardYourRank;

  /// No description provided for @leaderboardPlayersCount.
  ///
  /// In en, this message translates to:
  /// **'{count} players'**
  String leaderboardPlayersCount(Object count);

  /// No description provided for @referralInviteFriends.
  ///
  /// In en, this message translates to:
  /// **'Invite Friends'**
  String get referralInviteFriends;

  /// No description provided for @referralYourCode.
  ///
  /// In en, this message translates to:
  /// **'Your Referral Code'**
  String get referralYourCode;

  /// No description provided for @referralEnterCode.
  ///
  /// In en, this message translates to:
  /// **'Enter referral code'**
  String get referralEnterCode;

  /// No description provided for @referralApply.
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get referralApply;

  /// No description provided for @referralShareVia.
  ///
  /// In en, this message translates to:
  /// **'Share Via'**
  String get referralShareVia;

  /// No description provided for @referralWhatsapp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get referralWhatsapp;

  /// No description provided for @referralTelegram.
  ///
  /// In en, this message translates to:
  /// **'Telegram'**
  String get referralTelegram;

  /// No description provided for @referralSms.
  ///
  /// In en, this message translates to:
  /// **'SMS'**
  String get referralSms;

  /// No description provided for @referralCopyCode.
  ///
  /// In en, this message translates to:
  /// **'Copy Code'**
  String get referralCopyCode;

  /// No description provided for @referralHistory.
  ///
  /// In en, this message translates to:
  /// **'Referral History'**
  String get referralHistory;

  /// No description provided for @referralPointsEarned.
  ///
  /// In en, this message translates to:
  /// **'Points Earned'**
  String get referralPointsEarned;

  /// No description provided for @notificationsInbox.
  ///
  /// In en, this message translates to:
  /// **'Notification Inbox'**
  String get notificationsInbox;

  /// No description provided for @notificationsPreferences.
  ///
  /// In en, this message translates to:
  /// **'Notification Preferences'**
  String get notificationsPreferences;

  /// No description provided for @notificationsReminders.
  ///
  /// In en, this message translates to:
  /// **'Reminders'**
  String get notificationsReminders;

  /// No description provided for @settingsAccount.
  ///
  /// In en, this message translates to:
  /// **'Account & Settings'**
  String get settingsAccount;

  /// No description provided for @settingsEditProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get settingsEditProfile;

  /// No description provided for @settingsTerms.
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get settingsTerms;

  /// No description provided for @settingsPrivacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get settingsPrivacy;

  /// No description provided for @settingsAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get settingsAbout;

  /// No description provided for @settingsPointsBalance.
  ///
  /// In en, this message translates to:
  /// **'Points Balance'**
  String get settingsPointsBalance;

  /// No description provided for @settingsWalletBalance.
  ///
  /// In en, this message translates to:
  /// **'Wallet Balance'**
  String get settingsWalletBalance;

  /// No description provided for @settingsAdminPanel.
  ///
  /// In en, this message translates to:
  /// **'Admin Panel'**
  String get settingsAdminPanel;

  /// No description provided for @feedCommunity.
  ///
  /// In en, this message translates to:
  /// **'Community Feed'**
  String get feedCommunity;

  /// No description provided for @feedWhatsOnMind.
  ///
  /// In en, this message translates to:
  /// **'What\'s on your mind?'**
  String get feedWhatsOnMind;

  /// No description provided for @feedAddComment.
  ///
  /// In en, this message translates to:
  /// **'Add a comment...'**
  String get feedAddComment;

  /// No description provided for @chatTitle.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chatTitle;

  /// No description provided for @chatTypeMessage.
  ///
  /// In en, this message translates to:
  /// **'Type a message...'**
  String get chatTypeMessage;

  /// No description provided for @spinDailySpin.
  ///
  /// In en, this message translates to:
  /// **'Daily Spin'**
  String get spinDailySpin;

  /// No description provided for @spinSpinTheWheel.
  ///
  /// In en, this message translates to:
  /// **'Spin the Wheel'**
  String get spinSpinTheWheel;

  /// No description provided for @pollsDailyPoll.
  ///
  /// In en, this message translates to:
  /// **'Daily Poll'**
  String get pollsDailyPoll;

  /// No description provided for @pollsNoActivePoll.
  ///
  /// In en, this message translates to:
  /// **'No Active Poll'**
  String get pollsNoActivePoll;

  /// No description provided for @achievementsTitle.
  ///
  /// In en, this message translates to:
  /// **'Achievements'**
  String get achievementsTitle;

  /// No description provided for @winnersHistory.
  ///
  /// In en, this message translates to:
  /// **'Winners History'**
  String get winnersHistory;

  /// No description provided for @compensationHistory.
  ///
  /// In en, this message translates to:
  /// **'Compensation History'**
  String get compensationHistory;

  /// No description provided for @supportTitle.
  ///
  /// In en, this message translates to:
  /// **'Support'**
  String get supportTitle;

  /// No description provided for @supportFaqs.
  ///
  /// In en, this message translates to:
  /// **'FAQs'**
  String get supportFaqs;

  /// No description provided for @supportNewTicket.
  ///
  /// In en, this message translates to:
  /// **'New Ticket'**
  String get supportNewTicket;

  /// No description provided for @legalTermsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get legalTermsOfService;

  /// No description provided for @legalPrivacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get legalPrivacyPolicy;

  /// No description provided for @legalLegality.
  ///
  /// In en, this message translates to:
  /// **'Legality'**
  String get legalLegality;

  /// No description provided for @legalResponsibleGaming.
  ///
  /// In en, this message translates to:
  /// **'Responsible Gaming'**
  String get legalResponsibleGaming;

  /// No description provided for @legalContactUs.
  ///
  /// In en, this message translates to:
  /// **'Contact Us'**
  String get legalContactUs;

  /// No description provided for @legalJobs.
  ///
  /// In en, this message translates to:
  /// **'Careers'**
  String get legalJobs;

  /// No description provided for @prizeHomesTitle.
  ///
  /// In en, this message translates to:
  /// **'Prize Homes'**
  String get prizeHomesTitle;

  /// No description provided for @prizeHomesBrowseByLocation.
  ///
  /// In en, this message translates to:
  /// **'Browse by Location'**
  String get prizeHomesBrowseByLocation;

  /// No description provided for @adminDashboard.
  ///
  /// In en, this message translates to:
  /// **'Admin Dashboard'**
  String get adminDashboard;

  /// No description provided for @adminManageContests.
  ///
  /// In en, this message translates to:
  /// **'Manage Contests'**
  String get adminManageContests;

  /// No description provided for @adminUserManagement.
  ///
  /// In en, this message translates to:
  /// **'User Management'**
  String get adminUserManagement;

  /// No description provided for @adminKycApprovals.
  ///
  /// In en, this message translates to:
  /// **'KYC Approvals'**
  String get adminKycApprovals;

  /// No description provided for @adminSupportTickets.
  ///
  /// In en, this message translates to:
  /// **'Support Tickets'**
  String get adminSupportTickets;

  /// No description provided for @adminSystemConfig.
  ///
  /// In en, this message translates to:
  /// **'System Config'**
  String get adminSystemConfig;

  /// No description provided for @communityGuidelinesTitle.
  ///
  /// In en, this message translates to:
  /// **'Community Guidelines'**
  String get communityGuidelinesTitle;

  /// No description provided for @howToPlayTitle.
  ///
  /// In en, this message translates to:
  /// **'How to Play'**
  String get howToPlayTitle;

  /// No description provided for @updateNewVersion.
  ///
  /// In en, this message translates to:
  /// **'New Version Available'**
  String get updateNewVersion;

  /// No description provided for @updateUpdateNow.
  ///
  /// In en, this message translates to:
  /// **'Update Now'**
  String get updateUpdateNow;

  /// Label for exiting the app
  ///
  /// In en, this message translates to:
  /// **'Exit App'**
  String get exitApp;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
