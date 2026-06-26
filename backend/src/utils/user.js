function splitName(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

function fullName(user) {
  if (user.name) {
    return String(user.name).trim()
  }

  return `${user.first_name || ''} ${user.last_name || ''}`.trim()
}

function publicUser(user) {
  const { firstName, lastName } = splitName(user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim())

  return {
    id: user.id,
    firstName,
    lastName,
    name: fullName(user),
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    lastLogin: user.last_login || null,
    phone: user.phone || null,
  }
}

function publicProfile(profile) {
  if (!profile) return null

  return {
    id: profile.id,
    userId: profile.user_id,
    phone: profile.phone || null,
    dateOfBirth: profile.date_of_birth,
    gender: profile.gender,
    emergencyContact: profile.emergency_contact,
    streetAddress: profile.street_address,
    city: profile.city,
    district: profile.district,
    bloodGroup: profile.blood_group,
    allergies: profile.allergies,
    medicalNotes: profile.medical_notes,
  }
}

module.exports = {
  splitName,
  fullName,
  publicUser,
  publicProfile,
  publicPatient: publicProfile,
}