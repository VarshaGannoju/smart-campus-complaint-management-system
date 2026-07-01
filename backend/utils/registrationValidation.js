const COLLEGE_DOMAIN = 'cvr.ac.in';
const MIN_BATCH_YEAR = 22;
const ROLL_NUMBER_REGEX = /^(2[2-9]|[3-9]\d)[A-Z0-9]{8}$/;

const normalizeCollegeIdentity = ({ email, rollNumber, name }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRollNumber = String(rollNumber || '').trim().toUpperCase();
  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    return { error: 'Name is required.' };
  }

  if (!normalizedEmail || !normalizedRollNumber) {
    return { error: 'College email and roll number are required.' };
  }

  const emailParts = normalizedEmail.split('@');
  if (emailParts.length !== 2) {
    return { error: 'Please enter a valid email address.' };
  }

  const [localPart, domain] = emailParts;
  if (domain !== COLLEGE_DOMAIN) {
    return { error: `Use your college Outlook email ending with @${COLLEGE_DOMAIN}.` };
  }

  if (!ROLL_NUMBER_REGEX.test(normalizedRollNumber)) {
    return {
      error: 'Roll number must be in CVR format like 24B81A67Q9 and belong to batch 22 or later.'
    };
  }

  const admissionYear = Number.parseInt(normalizedRollNumber.slice(0, 2), 10);
  if (admissionYear < MIN_BATCH_YEAR) {
    return { error: `Only students from batch ${MIN_BATCH_YEAR} and later can register.` };
  }

  if (localPart.toUpperCase() !== normalizedRollNumber) {
    return { error: 'Email must match your roll number exactly, for example 24B81A67Q9@cvr.ac.in.' };
  }

  return {
    normalizedEmail,
    normalizedRollNumber,
    normalizedName
  };
};

module.exports = {
  COLLEGE_DOMAIN,
  MIN_BATCH_YEAR,
  ROLL_NUMBER_REGEX,
  normalizeCollegeIdentity
};
