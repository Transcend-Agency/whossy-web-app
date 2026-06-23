import {GeoPoint, Timestamp } from "firebase/firestore";

export type User = {
  bio?: string | null;
  date_of_birth?: Timestamp | Date | null;
  created_at?: Timestamp | Date | null;
  distance?: number | null;
  geohash?: string | null;
  is_premium?: boolean | null;
  drink?: number | null;
  education?: number | null;
  love_language?: number | null;
  meet?: number | null;
  pets?: number | null;
  photos?: string[] | null;
  preference?: number | null;
  smoke?: number | null;
  workout?: number | null;
  notifications?: boolean | null;
  auth_provider?: string | null;
  country_of_origin?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  has_completed_account_creation?: boolean;
  has_completed_onboarding?: boolean;
  phone_number?: string | null;
  uid?: string | null;
  weight?: number | null;
  height?: number | null;
  religion?: number | null;
  interests?: string[] | null;
  is_approved?: boolean | null;
  status?: {
    online: boolean;
    lastSeen: number;
  } | null;
  state?: string | null;
  family_goal?: number | null;
  marital_status?: number | null;
  zodiac?: number | null;
  user_settings?: {
    incoming_messages?: boolean;
    online_status?: boolean;
    public_search?: boolean;
    read_receipts?: boolean;
  } | null;
  blockedIds?: string[] | null;
  location?: GeoPoint | null;
  latitude?: number | null;
  longitude?: number | null;
  geography?: {
    geohash: string,
    geopoint: GeoPoint
  };
  credit_balance?: number | null;
  amount_paid_in_total?: {
    naira?: number | null,
    kenyan_shillings?: number | null,
  };
  paystack?: {
    charge_success?: {
      currency?: string
    },
    reference: string,
    subscription_code: string,
    email_token: string,
    customer_id: number,
    customer_code: string,
    authorization_code: string,
    status: string,
  } | null;
  currency?: string | null;
  is_banned?: boolean | null;
  face_verification?: {
    retake_photo?: boolean | null;
    photo?: string | null;
    updated_at?: Timestamp | Date | null;
  }
  tour_guide?: {
    explore?: boolean;
    "swipe-and-match"?: boolean;
    matches?: boolean;
    chat?: boolean;
    "user-profile"?: boolean;
    "notification"?: boolean;
  }
};

export type UserFilters = {
  age_range?: { max: number; min: number };
  city?: string;
  distance?: number;
  communication_style?: number;
  country?: string;
  dietary?: number;
  drink?: number;
  education?: number;
  family_goals?: number;
  family_goal?: number;
  family_plans?: number;
  gender?: string;
  has_bio?: boolean;
  height_range?: { max: number; min: number };
  interests?: string[];
  marital_status?: number;
  love_language?: number;
  meet?: number;
  outreach?: boolean;
  pets?: number | null;
  preference?: number;
  religion?: number;
  similar_interest?: boolean;
  smoke?: number;
  weight_range?: { max: number; min: number };
  workout?: number;
  zodiac?: number;
};

export type AdvancedSearchPreferences = {
  age_range?: { max: number | null; min: number | null };
  gender?: string;
  relationship_preference?: number | null;
  height?: number;
  country?: string;
  religion?: number | null
}

export type UserProfile = User | UserFilters | AdvancedSearchPreferences;

