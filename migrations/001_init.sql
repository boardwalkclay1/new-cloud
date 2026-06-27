-- ============================================================
-- CLOUD USERS (UNIVERSAL ACCOUNT)
-- ============================================================

CREATE TABLE cloud_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  passwordHash TEXT,
  name TEXT,
  photoUrl TEXT,
  bio TEXT,
  roles TEXT,
  createdAt TEXT
);

-- ============================================================
-- PROPOSALS / PETITIONS / POLLS
-- ============================================================

CREATE TABLE cloud_proposals (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  createdByUserId TEXT,
  createdAt TEXT
);

CREATE TABLE cloud_petitions (
  id TEXT PRIMARY KEY,
  proposalId TEXT,
  title TEXT,
  goalCount INTEGER,
  createdAt TEXT
);

CREATE TABLE cloud_petition_signatures (
  id TEXT PRIMARY KEY,
  petitionId TEXT,
  userId TEXT,
  signedAt TEXT
);

CREATE TABLE cloud_polls (
  id TEXT PRIMARY KEY,
  proposalId TEXT,
  question TEXT,
  createdAt TEXT
);

CREATE TABLE cloud_poll_options (
  id TEXT PRIMARY KEY,
  pollId TEXT,
  label TEXT
);

CREATE TABLE cloud_poll_votes (
  id TEXT PRIMARY KEY,
  pollId TEXT,
  optionId TEXT,
  userId TEXT,
  votedAt TEXT
);

-- ============================================================
-- VENDOR & RIDER APPLICATIONS
-- ============================================================

CREATE TABLE vendor_applications (
  id TEXT PRIMARY KEY,
  userId TEXT,
  businessName TEXT,
  description TEXT,
  status TEXT,
  createdAt TEXT
);

CREATE TABLE rider_applications (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vehicleType TEXT,
  experience TEXT,
  status TEXT,
  createdAt TEXT
);

-- ============================================================
-- THE NETWORK (VENDORS / PRODUCTS / SERVICES / WORKSHOPS)
-- ============================================================

CREATE TABLE network_vendors (
  id TEXT PRIMARY KEY,
  ownerUserId TEXT,
  name TEXT,
  bio TEXT,
  photoUrl TEXT,
  categories TEXT,
  tags TEXT,
  active INTEGER,
  createdAt TEXT
);

CREATE TABLE network_products (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  name TEXT,
  description TEXT,
  price REAL,
  photoUrl TEXT,
  tags TEXT,
  active INTEGER,
  createdAt TEXT
);

CREATE TABLE network_services (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  name TEXT,
  description TEXT,
  price REAL,
  photoUrl TEXT,
  tags TEXT,
  active INTEGER,
  createdAt TEXT
);

CREATE TABLE network_workshops (
  id TEXT PRIMARY KEY,
  vendorId TEXT,
  title TEXT,
  schedule TEXT,
  description TEXT,
  price REAL,
  active INTEGER,
  createdAt TEXT
);

CREATE TABLE network_orders (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vendorId TEXT,
  productId TEXT,
  price REAL,
  paypalOrderId TEXT,
  status TEXT,
  createdAt TEXT
);

-- ============================================================
-- FAST ROLL (CLIENT / RIDER / ORDERS / TIPS)
-- ============================================================

CREATE TABLE fastroll_clients (
  id TEXT PRIMARY KEY,
  userId TEXT,
  defaultAddress TEXT,
  phone TEXT,
  createdAt TEXT
);

CREATE TABLE fastroll_riders (
  id TEXT PRIMARY KEY,
  userId TEXT,
  vehicleType TEXT,
  bio TEXT,
  photoUrl TEXT,
  active INTEGER,
  createdAt TEXT
);

CREATE TABLE fastroll_orders (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  riderId TEXT,
  networkOrderId TEXT,
  pickupLocation TEXT,
  dropoffLocation TEXT,
  status TEXT,
  createdAt TEXT
);

CREATE TABLE fastroll_tips (
  id TEXT PRIMARY KEY,
  orderId TEXT,
  clientId TEXT,
  riderId TEXT,
  amount REAL,
  createdAt TEXT
);
