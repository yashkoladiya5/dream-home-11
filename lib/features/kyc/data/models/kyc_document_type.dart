enum KycDocumentType {
  aadhaarFront,
  aadhaarBack,
  panCard,
  selfie;

  String get apiValue {
    switch (this) {
      case KycDocumentType.aadhaarFront:
        return 'aadhaar_front';
      case KycDocumentType.aadhaarBack:
        return 'aadhaar_back';
      case KycDocumentType.panCard:
        return 'pan_card';
      case KycDocumentType.selfie:
        return 'selfie';
    }
  }

  String get displayName {
    switch (this) {
      case KycDocumentType.aadhaarFront:
        return 'Aadhaar (Front)';
      case KycDocumentType.aadhaarBack:
        return 'Aadhaar (Back)';
      case KycDocumentType.panCard:
        return 'PAN Card';
      case KycDocumentType.selfie:
        return 'Selfie';
    }
  }

  String get hint {
    switch (this) {
      case KycDocumentType.aadhaarFront:
        return 'Upload front side of your Aadhaar card';
      case KycDocumentType.aadhaarBack:
        return 'Upload back side of your Aadhaar card';
      case KycDocumentType.panCard:
        return 'Upload your PAN card';
      case KycDocumentType.selfie:
        return 'Take a selfie holding your Aadhaar card';
    }
  }
}
