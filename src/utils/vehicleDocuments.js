const DATE_PREFIX_PATTERN = /^\d{4}-\d{2}-\d{2}/;

export const VEHICLE_DOCUMENT_TEXT_FIELDS = [
  'registration_number',
  'registration_owner_name',
  'registration_image_url',
  'inspection_certificate_no',
  'inspection_image_url',
  'insurance_provider',
  'insurance_policy_no',
  'insurance_image_url',
];

export const VEHICLE_DOCUMENT_DATE_FIELDS = [
  'registration_issued_date',
  'inspection_last_date',
  'inspection_expiry_date',
  'insurance_start_date',
  'insurance_expiry_date',
];

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function normalizeNullableText(value, { uppercase = false } = {}) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  return uppercase ? trimmed.toUpperCase() : trimmed;
}

export function normalizeVehicleDateValue(value) {
  if (value === undefined || value === null) {
    return '';
  }

  const raw = String(value).trim();
  if (!raw) {
    return '';
  }

  const datePrefix = raw.match(DATE_PREFIX_PATTERN);
  if (datePrefix) {
    return datePrefix[0];
  }

  return raw;
}

function normalizeNullableDate(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = normalizeVehicleDateValue(value);
  return normalized || null;
}

function normalizeCustomerId(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const numericValue = Number(trimmed);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return trimmed;
}

export function getVehicleModelName(vehicle) {
  return (
    vehicle?.model ||
    vehicle?.vehicle_model ||
    vehicle?.car_model ||
    vehicle?.model_name ||
    vehicle?.vehicle_type ||
    ''
  );
}

export function getVehicleCustomerName(vehicle) {
  return vehicle?.customer_name || vehicle?.customer?.name || null;
}

export function normalizeVehicleResponse(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') {
    return vehicle;
  }

  return {
    ...vehicle,
    model: getVehicleModelName(vehicle) || null,
    customer_name: getVehicleCustomerName(vehicle),
    registration_number: vehicle.registration_number ?? null,
    registration_owner_name: vehicle.registration_owner_name ?? null,
    registration_issued_date: vehicle.registration_issued_date ?? null,
    registration_image_url: vehicle.registration_image_url ?? null,
    inspection_certificate_no: vehicle.inspection_certificate_no ?? null,
    inspection_last_date: vehicle.inspection_last_date ?? null,
    inspection_expiry_date: vehicle.inspection_expiry_date ?? null,
    inspection_image_url: vehicle.inspection_image_url ?? null,
    inspection_status: vehicle.inspection_status ?? null,
    insurance_provider: vehicle.insurance_provider ?? null,
    insurance_policy_no: vehicle.insurance_policy_no ?? null,
    insurance_start_date: vehicle.insurance_start_date ?? null,
    insurance_expiry_date: vehicle.insurance_expiry_date ?? null,
    insurance_image_url: vehicle.insurance_image_url ?? null,
    insurance_status: vehicle.insurance_status ?? null,
  };
}

export function normalizeVehicleForm(vehicle) {
  return {
    license_plate: vehicle?.license_plate || '',
    model: getVehicleModelName(vehicle),
    image_url: vehicle?.image_url || '',
    registration_number: vehicle?.registration_number || '',
    registration_owner_name: vehicle?.registration_owner_name || '',
    registration_issued_date: normalizeVehicleDateValue(vehicle?.registration_issued_date),
    registration_image_url: vehicle?.registration_image_url || '',
    inspection_certificate_no: vehicle?.inspection_certificate_no || '',
    inspection_last_date: normalizeVehicleDateValue(vehicle?.inspection_last_date),
    inspection_expiry_date: normalizeVehicleDateValue(vehicle?.inspection_expiry_date),
    inspection_image_url: vehicle?.inspection_image_url || '',
    insurance_provider: vehicle?.insurance_provider || '',
    insurance_policy_no: vehicle?.insurance_policy_no || '',
    insurance_start_date: normalizeVehicleDateValue(vehicle?.insurance_start_date),
    insurance_expiry_date: normalizeVehicleDateValue(vehicle?.insurance_expiry_date),
    insurance_image_url: vehicle?.insurance_image_url || '',
  };
}

export function buildVehiclePayload(source = {}) {
  const payload = {};

  if (hasOwn(source, 'customer_id')) {
    payload.customer_id = normalizeCustomerId(source.customer_id);
  }

  if (hasOwn(source, 'license_plate')) {
    payload.license_plate = normalizeNullableText(source.license_plate, { uppercase: true });
  }

  if (hasOwn(source, 'model')) {
    payload.model = normalizeNullableText(source.model);
  }

  if (hasOwn(source, 'image_url')) {
    payload.image_url = normalizeNullableText(source.image_url);
  }

  VEHICLE_DOCUMENT_TEXT_FIELDS.forEach((fieldName) => {
    if (hasOwn(source, fieldName)) {
      payload[fieldName] = normalizeNullableText(source[fieldName]);
    }
  });

  VEHICLE_DOCUMENT_DATE_FIELDS.forEach((fieldName) => {
    if (hasOwn(source, fieldName)) {
      payload[fieldName] = normalizeNullableDate(source[fieldName]);
    }
  });

  return payload;
}
