// SAFE CLOUD MODES

const SAFE_CLOUD_MODES = {
  kidnapping: {
    label: "Kidnapping Mode",
    thresholds: {
      jerk: 20,
      flipAngle: 140,
      dragSpeed: 0.7,
      sprintSpeed: 4.0,
      kidnappingAccel: 30
    },
    severity: "critical",
    autoRecord: true,
    notifyContacts: true,
    notifyPolice: true
  },

  snatch: {
    label: "Snatch Mode",
    thresholds: {
      jerk: 22,
      flipAngle: 160,
      sprintSpeed: 4.5
    },
    severity: "high",
    autoRecord: true,
    notifyContacts: true,
    notifyPolice: false
  },

  fall: {
    label: "Fall Detection",
    thresholds: {
      fallAccel: 24,
      impactAccel: 30,
      flipAngle: 100,
      stillnessTime: 3.5,
      jerk: 15
    },
    severity: "medium",
    autoRecord: true,
    notifyContacts: true,
    notifyPolice: false
  },

  night: {
    label: "Night Mode",
    thresholds: {
      jerk: 18,
      flipAngle: 130,
      fallAccel: 22,
      dragSpeed: 1.0
    },
    severity: "medium",
    autoRecord: false,
    notifyContacts: true,
    notifyPolice: false
  },

  solo: {
    label: "Solo Mode",
    thresholds: {
      jerk: 16,
      flipAngle: 150,
      dragSpeed: 0.9
    },
    severity: "medium",
    autoRecord: false,
    notifyContacts: true,
    notifyPolice: false
  },

  vendor: {
    label: "Vendor Mode",
    thresholds: {
      jerk: 12,
      dragSpeed: 1.1
    },
    severity: "low",
    autoRecord: false,
    notifyContacts: false,
    notifyPolice: false
  },

  highrisk: {
    label: "High‑Risk Mode",
    thresholds: {
      jerk: 10,
      flipAngle: 120,
      dragSpeed: 0.8
    },
    severity: "high",
    autoRecord: true,
    notifyContacts: true,
    notifyPolice: true
  }
};
