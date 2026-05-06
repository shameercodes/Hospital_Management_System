/**
 * HMS — Rich demo data seeder
 *
 * Populates: users, doctors, patients (incl. inpatients), wards (with bed→patient links),
 * medicines, appointments (across 6 months), invoices (paid/partial/unpaid), lab tests
 * (linked to the appointments that ordered them).
 *
 * IMPORTANT: most of these models rely on pre('save') hooks for auto-IDs (patientId,
 * appointmentId, doctorId, invoiceNumber, testId). DO NOT replace .create() with
 * insertMany() — middleware is bypassed and uniques will collide on null.
 */

const dotenv  = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const User        = require('../models/User');
const Doctor      = require('../models/Doctor');
const Patient     = require('../models/Patient');
const Ward        = require('../models/Ward');
const Medicine    = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const Invoice     = require('../models/Invoice');
const LabTest     = require('../models/LabTest');

// ─── helpers ────────────────────────────────────────────────────────────────
const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick   = arr => arr[rand(0, arr.length - 1)];
const pickN  = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const chance = p => Math.random() < p;
const daysAgo = d => { const x = new Date(); x.setDate(x.getDate() - d); return x; };
const daysFromNow = d => { const x = new Date(); x.setDate(x.getDate() + d); return x; };
const dobFromAge = years => { const d = new Date(); d.setFullYear(d.getFullYear() - years); d.setDate(d.getDate() - rand(0, 364)); return d; };

const PHONE = () => `+92-3${rand(0,9)}${rand(0,9)}-${String(rand(1000000, 9999999))}`;
const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const CITIES = ['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Gujranwala','Hyderabad','Bahawalpur','Sargodha','Sukkur'];
const STREETS = ['Main Boulevard','Jail Road','Mall Road','Liaqat Road','Shahrah-e-Faisal','Murree Road','Gulberg III','DHA Phase V','Model Town','F-7','Bahria Town','Cantt','Saddar','Clifton','Defence'];

// ─── main ───────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    console.log('🗑️  Clearing existing data…');
    await Promise.all([
      User.deleteMany(), Doctor.deleteMany(), Patient.deleteMany(),
      Ward.deleteMany(), Medicine.deleteMany(),
      Appointment.deleteMany(), Invoice.deleteMany(), LabTest.deleteMany(),
    ]);

    // ── Users ────────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'System Administrator', email: 'admin@hospital.com',
      password: 'Admin@123', role: 'admin', employeeId: 'EMP-0001',
      phone: '+92-300-0000000', department: 'Administration'
    });

    const docUserData = [
      { name: 'Dr. Ahmed Khan',    email: 'dr.ahmed@hospital.com',    password: 'Doctor@123', role: 'doctor', department: 'Cardiology',    phone: '+92-300-1111111', employeeId: 'EMP-0002' },
      { name: 'Dr. Sara Ali',      email: 'dr.sara@hospital.com',     password: 'Doctor@123', role: 'doctor', department: 'Pediatrics',    phone: '+92-300-2222222', employeeId: 'EMP-0003' },
      { name: 'Dr. Bilal Hassan',  email: 'dr.bilal@hospital.com',    password: 'Doctor@123', role: 'doctor', department: 'Orthopedics',   phone: '+92-300-3333333', employeeId: 'EMP-0004' },
      { name: 'Dr. Fatima Malik',  email: 'dr.fatima@hospital.com',   password: 'Doctor@123', role: 'doctor', department: 'Neurology',     phone: '+92-300-4444444', employeeId: 'EMP-0005' },
      { name: 'Dr. Omar Sheikh',   email: 'dr.omar@hospital.com',     password: 'Doctor@123', role: 'doctor', department: 'General Medicine', phone: '+92-300-1212121', employeeId: 'EMP-0012' },
      { name: 'Dr. Hina Raza',     email: 'dr.hina@hospital.com',     password: 'Doctor@123', role: 'doctor', department: 'Obstetrics & Gynecology', phone: '+92-300-1313131', employeeId: 'EMP-0013' },
      { name: 'Dr. Asad Iqbal',    email: 'dr.asad@hospital.com',     password: 'Doctor@123', role: 'doctor', department: 'Dermatology',   phone: '+92-300-1414141', employeeId: 'EMP-0014' },
      { name: 'Dr. Mehwish Tariq', email: 'dr.mehwish@hospital.com',  password: 'Doctor@123', role: 'doctor', department: 'ENT',           phone: '+92-300-1515151', employeeId: 'EMP-0015' },
      { name: 'Dr. Junaid Akram',  email: 'dr.junaid@hospital.com',   password: 'Doctor@123', role: 'doctor', department: 'Ophthalmology', phone: '+92-300-1616161', employeeId: 'EMP-0016' },
      { name: 'Dr. Saima Butt',    email: 'dr.saima@hospital.com',    password: 'Doctor@123', role: 'doctor', department: 'Psychiatry',    phone: '+92-300-1717171', employeeId: 'EMP-0017' },
    ];
    const docUsers = [];
    for (const d of docUserData) docUsers.push(await User.create(d));

    const staffData = [
      { name: 'Nurse Ayesha',       email: 'nurse.ayesha@hospital.com',    password: 'Nurse@123',     role: 'nurse',          department: 'General',    phone: '+92-300-5555555', employeeId: 'EMP-0006' },
      { name: 'Reception Ali',      email: 'reception.ali@hospital.com',   password: 'Reception@123', role: 'receptionist',   department: 'Reception',  phone: '+92-300-6666666', employeeId: 'EMP-0007' },
      { name: 'Pharmacist Usman',   email: 'pharmacy.usman@hospital.com',  password: 'Pharmacy@123',  role: 'pharmacist',     department: 'Pharmacy',   phone: '+92-300-7777777', employeeId: 'EMP-0008' },
      { name: 'Lab Tech Zara',      email: 'lab.zara@hospital.com',        password: 'Lab@12345',     role: 'lab_technician', department: 'Laboratory', phone: '+92-300-8888888', employeeId: 'EMP-0009' },
      { name: 'Accountant Hassan',  email: 'accounts.hassan@hospital.com', password: 'Account@123',   role: 'accountant',     department: 'Accounts',   phone: '+92-300-9999999', employeeId: 'EMP-0010' },
      { name: 'Nurse Maria',        email: 'nurse.maria@hospital.com',     password: 'Nurse@123',     role: 'nurse',          department: 'ICU',        phone: '+92-301-1111111', employeeId: 'EMP-0011' },
      { name: 'Nurse Sadia',        email: 'nurse.sadia@hospital.com',     password: 'Nurse@123',     role: 'nurse',          department: 'Pediatrics', phone: '+92-301-2222222', employeeId: 'EMP-0018' },
      { name: 'Nurse Faiza',        email: 'nurse.faiza@hospital.com',     password: 'Nurse@123',     role: 'nurse',          department: 'Emergency',  phone: '+92-301-3333333', employeeId: 'EMP-0019' },
      { name: 'Reception Hamza',    email: 'reception.hamza@hospital.com', password: 'Reception@123', role: 'receptionist',   department: 'Reception',  phone: '+92-301-4444444', employeeId: 'EMP-0020' },
      { name: 'Lab Tech Imran',     email: 'lab.imran@hospital.com',       password: 'Lab@12345',     role: 'lab_technician', department: 'Laboratory', phone: '+92-301-5555555', employeeId: 'EMP-0021' },
      { name: 'Pharmacist Nadia',   email: 'pharmacy.nadia@hospital.com',  password: 'Pharmacy@123',  role: 'pharmacist',     department: 'Pharmacy',   phone: '+92-301-6666666', employeeId: 'EMP-0022' },
    ];
    const staffUsers = [];
    for (const s of staffData) staffUsers.push(await User.create(s));
    console.log(`✅ ${1 + docUsers.length + staffUsers.length} users created (1 admin + ${docUsers.length} doctors + ${staffUsers.length} staff)`);

    // ── Doctors (use .create() so doctorId pre-save hook fires) ──────────
    const fullSchedule = [
      { day: 'monday',    startTime: '09:00', endTime: '17:00', maxPatients: 20, isAvailable: true },
      { day: 'tuesday',   startTime: '09:00', endTime: '17:00', maxPatients: 20, isAvailable: true },
      { day: 'wednesday', startTime: '09:00', endTime: '13:00', maxPatients: 10, isAvailable: true },
      { day: 'thursday',  startTime: '09:00', endTime: '17:00', maxPatients: 20, isAvailable: true },
      { day: 'friday',    startTime: '09:00', endTime: '12:00', maxPatients:  8, isAvailable: true },
      { day: 'saturday',  startTime: '10:00', endTime: '14:00', maxPatients: 10, isAvailable: true },
    ];
    const eveningSchedule = [
      { day: 'monday',    startTime: '14:00', endTime: '20:00', maxPatients: 15, isAvailable: true },
      { day: 'tuesday',   startTime: '14:00', endTime: '20:00', maxPatients: 15, isAvailable: true },
      { day: 'wednesday', startTime: '14:00', endTime: '20:00', maxPatients: 15, isAvailable: true },
      { day: 'thursday',  startTime: '14:00', endTime: '20:00', maxPatients: 15, isAvailable: true },
      { day: 'saturday',  startTime: '10:00', endTime: '14:00', maxPatients: 10, isAvailable: true },
    ];
    const doctorProfiles = [
      { user: docUsers[0]._id, specialization: 'Cardiologist',         department: 'Cardiology',     qualification: ['MBBS','FCPS Cardiology'],            experience: 15, licenseNumber: 'PMC-12345', consultationFee: 2000, schedule: fullSchedule,     languages: ['English','Urdu'],            rating: 4.8, totalReviews: 142, bio: 'Senior interventional cardiologist with 15 years of experience in coronary artery disease and angioplasty.' },
      { user: docUsers[1]._id, specialization: 'Pediatrician',         department: 'Pediatrics',     qualification: ['MBBS','DCH','FCPS Pediatrics'],      experience: 10, licenseNumber: 'PMC-23456', consultationFee: 1500, schedule: fullSchedule,     languages: ['English','Urdu','Punjabi'], rating: 4.9, totalReviews: 218, bio: 'Pediatric specialist focused on neonatal care, growth disorders, and childhood vaccinations.' },
      { user: docUsers[2]._id, specialization: 'Orthopedic Surgeon',   department: 'Orthopedics',    qualification: ['MBBS','FCPS Orthopedics','FRCS'],    experience: 12, licenseNumber: 'PMC-34567', consultationFee: 2500, schedule: fullSchedule,     languages: ['English','Urdu'],            rating: 4.6, totalReviews: 89,  bio: 'Specialist in joint replacement, sports injuries, and complex trauma surgery.' },
      { user: docUsers[3]._id, specialization: 'Neurologist',          department: 'Neurology',      qualification: ['MBBS','MRCP','FCPS Neurology'],      experience:  8, licenseNumber: 'PMC-45678', consultationFee: 3000, schedule: fullSchedule,     languages: ['English','Urdu'],            rating: 4.7, totalReviews: 56,  bio: 'Treats stroke, epilepsy, migraine, and neurodegenerative conditions.' },
      { user: docUsers[4]._id, specialization: 'General Physician',    department: 'General Medicine', qualification: ['MBBS','FCPS Medicine'],            experience: 18, licenseNumber: 'PMC-56789', consultationFee: 1200, schedule: fullSchedule,     languages: ['English','Urdu','Punjabi','Pashto'], rating: 4.7, totalReviews: 305, bio: 'General physician handling chronic disease management, preventive care, and primary diagnostics.' },
      { user: docUsers[5]._id, specialization: 'Obstetrician & Gynecologist', department: 'Obstetrics & Gynecology', qualification: ['MBBS','FCPS Gynae & Obs'], experience: 14, licenseNumber: 'PMC-67890', consultationFee: 2200, schedule: fullSchedule, languages: ['English','Urdu'],          rating: 4.9, totalReviews: 271, bio: 'Antenatal care, high-risk obstetrics, and minimally invasive gynecological surgery.' },
      { user: docUsers[6]._id, specialization: 'Dermatologist',        department: 'Dermatology',    qualification: ['MBBS','MD Dermatology'],             experience:  9, licenseNumber: 'PMC-78901', consultationFee: 2000, schedule: eveningSchedule, languages: ['English','Urdu'],            rating: 4.5, totalReviews: 134, bio: 'Treats acne, eczema, psoriasis, and offers cosmetic dermatology procedures.' },
      { user: docUsers[7]._id, specialization: 'ENT Surgeon',          department: 'ENT',            qualification: ['MBBS','FCPS Otolaryngology'],        experience: 11, licenseNumber: 'PMC-89012', consultationFee: 1800, schedule: fullSchedule,     languages: ['English','Urdu'],            rating: 4.6, totalReviews: 92,  bio: 'Ear, nose and throat surgery; sinusitis, hearing loss, and pediatric ENT conditions.' },
      { user: docUsers[8]._id, specialization: 'Ophthalmologist',      department: 'Ophthalmology',  qualification: ['MBBS','FCPS Ophthalmology'],         experience: 13, licenseNumber: 'PMC-90123', consultationFee: 1700, schedule: fullSchedule,     languages: ['English','Urdu'],            rating: 4.7, totalReviews: 121, bio: 'Cataract, glaucoma, and refractive surgery; comprehensive eye exams.' },
      { user: docUsers[9]._id, specialization: 'Psychiatrist',         department: 'Psychiatry',     qualification: ['MBBS','MCPS Psychiatry','MRCPsych'], experience:  7, licenseNumber: 'PMC-01234', consultationFee: 2500, schedule: eveningSchedule, languages: ['English','Urdu'],            rating: 4.8, totalReviews: 64,  bio: 'Depression, anxiety, bipolar and psychotic disorders; CBT-informed care.' },
    ];
    const doctors = [];
    for (const dp of doctorProfiles) doctors.push(await Doctor.create(dp));
    console.log(`✅ ${doctors.length} doctors created`);

    // ── Wards (start with empty beds; we'll occupy them with real patient refs below) ──
    const wards = await Promise.all([
      Ward.create({ name: 'General Ward A',   wardNumber: 'GW-A',   type: 'general',   floor: 1, totalBeds: 24, headNurse: staffUsers[0]._id, beds: Array.from({length:24}, (_,i) => ({ bedNumber: `GW-A-${String(i+1).padStart(2,'0')}`, type: 'general', status: 'available', dailyCharge: 2000 })) }),
      Ward.create({ name: 'General Ward B',   wardNumber: 'GW-B',   type: 'general',   floor: 1, totalBeds: 20, headNurse: staffUsers[0]._id, beds: Array.from({length:20}, (_,i) => ({ bedNumber: `GW-B-${String(i+1).padStart(2,'0')}`, type: 'general', status: 'available', dailyCharge: 2000 })) }),
      Ward.create({ name: 'ICU',              wardNumber: 'ICU-01', type: 'icu',       floor: 2, totalBeds: 12, headNurse: staffUsers[5]._id, beds: Array.from({length:12}, (_,i) => ({ bedNumber: `ICU-${String(i+1).padStart(2,'0')}`,   type: 'icu',     status: 'available', dailyCharge: 8000 })) }),
      Ward.create({ name: 'Pediatric Ward',   wardNumber: 'PW-01',  type: 'pediatric', floor: 3, totalBeds: 16, headNurse: staffUsers[6]._id, beds: Array.from({length:16}, (_,i) => ({ bedNumber: `PW-${String(i+1).padStart(2,'0')}`,    type: 'general', status: 'available', dailyCharge: 2500 })) }),
      Ward.create({ name: 'Private Rooms',    wardNumber: 'PR-01',  type: 'private',   floor: 4, totalBeds: 14, headNurse: staffUsers[0]._id, beds: Array.from({length:14}, (_,i) => ({ bedNumber: `PR-${String(i+1).padStart(2,'0')}`,    type: 'private', status: 'available', dailyCharge: 5000 })) }),
      Ward.create({ name: 'Maternity Ward',   wardNumber: 'MAT-01', type: 'maternity', floor: 3, totalBeds: 12, headNurse: staffUsers[0]._id, beds: Array.from({length:12}, (_,i) => ({ bedNumber: `MAT-${String(i+1).padStart(2,'0')}`,   type: 'general', status: 'available', dailyCharge: 3500 })) }),
      Ward.create({ name: 'Emergency',        wardNumber: 'ER-01',  type: 'emergency', floor: 1, totalBeds: 10, headNurse: staffUsers[7]._id, beds: Array.from({length:10}, (_,i) => ({ bedNumber: `ER-${String(i+1).padStart(2,'0')}`,    type: 'emergency', status: 'available', dailyCharge: 4500 })) }),
    ]);
    console.log(`✅ ${wards.length} wards created (empty)`);

    // ── Patients ─────────────────────────────────────────────────────────
    const firstNamesMale   = ['Ahmed','Ali','Hassan','Hussain','Bilal','Imran','Kamran','Nadeem','Faisal','Adnan','Asif','Tariq','Salman','Junaid','Waqar','Zubair','Asad','Faraz','Hamza','Saeed','Usman','Babar','Shahid','Wasim','Rashid','Naveed','Sohail','Yasir'];
    const firstNamesFemale = ['Ayesha','Sara','Fatima','Hina','Sana','Nadia','Sadia','Maria','Saima','Rabia','Nimra','Anum','Iqra','Mehwish','Faiza','Mahnoor','Zoya','Areeba','Bushra','Komal','Amna','Sumaiya','Hira','Tooba','Laiba','Aiman','Rida','Kainat'];
    const lastNames        = ['Khan','Ahmed','Malik','Hussain','Sheikh','Chaudhry','Raza','Butt','Awan','Qureshi','Iqbal','Mahmood','Siddiqui','Bhatti','Akhtar','Saeed','Shah','Hashmi','Akram','Tariq','Rana','Mughal','Abbasi','Baig','Memon','Ansari'];
    const allergens = [
      { allergen: 'Penicillin',  reaction: 'Skin rash, itching',     severity: 'moderate' },
      { allergen: 'Peanuts',     reaction: 'Anaphylaxis',            severity: 'severe' },
      { allergen: 'Shellfish',   reaction: 'Hives, swelling',        severity: 'moderate' },
      { allergen: 'Dust mites',  reaction: 'Sneezing, watery eyes',  severity: 'mild' },
      { allergen: 'Aspirin',     reaction: 'Stomach ulcers',         severity: 'moderate' },
      { allergen: 'Latex',       reaction: 'Skin irritation',        severity: 'mild' },
      { allergen: 'Pollen',      reaction: 'Allergic rhinitis',      severity: 'mild' },
      { allergen: 'Sulfa drugs', reaction: 'Severe skin reaction',   severity: 'severe' },
      { allergen: 'Eggs',        reaction: 'Stomach upset',          severity: 'mild' },
    ];
    const chronicList = ['Hypertension','Diabetes Type 2','Asthma','Arthritis','Hyperthyroidism','Hypothyroidism','High Cholesterol','GERD','Migraine','Anemia','Chronic Sinusitis','Osteoporosis','COPD','Epilepsy'];
    const insurers = ['State Life','EFU Health','Jubilee Life','Adamjee','TPL Insurance','Pak-Qatar Takaful', null, null, null, null];

    const patients = [];
    const TARGET_PATIENTS = 80;
    for (let i = 0; i < TARGET_PATIENTS; i++) {
      const gender = chance(0.52) ? 'female' : 'male';
      const fName = gender === 'female' ? pick(firstNamesFemale) : pick(firstNamesMale);
      const lName = pick(lastNames);
      // Age distribution roughly: 15% kids, 60% adults, 25% elderly
      const ageBucket = Math.random();
      const age = ageBucket < 0.15 ? rand(2, 14)
                : ageBucket < 0.75 ? rand(20, 55)
                : rand(56, 82);
      const city  = pick(CITIES);
      const ins   = pick(insurers);
      // Status mix:
      // ~12 inpatients, 3 critical, 4 observation, ~12 discharged, rest outpatient.
      let status;
      if (i < 12)      status = 'inpatient';
      else if (i < 15) status = 'critical';
      else if (i < 19) status = 'observation';
      else if (i < 31) status = 'discharged';
      else             status = 'outpatient';
      const createdDaysAgo = rand(0, 180);

      const p = await Patient.create({
        firstName: fName, lastName: lName,
        dateOfBirth: dobFromAge(age),
        gender,
        bloodGroup: pick(['A+','A-','B+','B-','AB+','AB-','O+','O-','O+','O+','A+','B+','O+','A+']), // weighted to common groups
        phone: PHONE(),
        email: chance(0.7) ? `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com` : undefined,
        address: { street: `${rand(1,200)} ${pick(STREETS)}`, city, state: city, postalCode: String(rand(40000, 75000)), country: 'Pakistan' },
        allergies: chance(0.4) ? pickN(allergens, rand(1, 2)) : [],
        chronicConditions: chance(0.5) ? pickN(chronicList, rand(1, 3)) : [],
        currentMedications: chance(0.35) ? [
          { name: pick(['Metformin','Atorvastatin','Amlodipine','Losartan','Omeprazole','Levothyroxine']), dosage: pick(['250mg','500mg','10mg','20mg','50mcg']), frequency: pick(['Once daily','Twice daily','At bedtime']) }
        ] : [],
        vitalSigns: Array.from({ length: rand(1, 4) }, () => ({
          recordedAt: daysAgo(rand(0, 60)),
          recordedBy: pick([staffUsers[0], staffUsers[5], staffUsers[6], staffUsers[7]])._id,
          bloodPressure: `${rand(105, 145)}/${rand(65, 95)}`,
          heartRate: rand(60, 100),
          temperature: +(36.2 + Math.random() * 1.6).toFixed(1),
          oxygenSaturation: rand(94, 100),
          respiratoryRate: rand(12, 22),
          weight: gender === 'female' ? rand(45, 80) : rand(55, 95),
          height: gender === 'female' ? rand(150, 175) : rand(160, 185),
        })),
        insurance: ins ? { provider: ins, policyNumber: `POL-${rand(100000, 999999)}`, groupNumber: `GRP-${rand(100, 999)}`, expiryDate: daysFromNow(rand(180, 720)) } : undefined,
        emergencyContact: { name: `${pick(firstNamesMale)} ${lName}`, relationship: pick(['Spouse','Father','Mother','Brother','Sister','Son','Daughter']), phone: PHONE() },
        status,
        assignedDoctor: pick(doctors)._id,
        registeredBy: pick([admin, ...staffUsers])._id,
        createdAt: daysAgo(createdDaysAgo),
      });
      // BMI
      if (p.vitalSigns.length) {
        for (const v of p.vitalSigns) {
          if (v.weight && v.height) v.bmi = +(v.weight / Math.pow(v.height/100, 2)).toFixed(1);
        }
        await p.save();
      }
      patients.push(p);
    }
    console.log(`✅ ${patients.length} patients created`);

    // ── Admit inpatients into actual ward beds ───────────────────────────
    // Spread admissions across all wards proportional to capacity.
    const inpatientStatuses = new Set(['inpatient','critical','observation']);
    const inpatients = patients.filter(p => inpatientStatuses.has(p.status));
    const occupiedSoFar = [];

    for (const patient of inpatients) {
      // Critical → ICU; pediatric (<14) → Pediatric ward; others → general/private/maternity
      let preferredWardIdx;
      const ageYears = (Date.now() - patient.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000);
      if (patient.status === 'critical') preferredWardIdx = 2;                          // ICU
      else if (ageYears < 15)            preferredWardIdx = 3;                          // Pediatric
      else if (chance(0.15))             preferredWardIdx = 4;                          // Private
      else if (patient.gender === 'female' && ageYears > 18 && chance(0.3)) preferredWardIdx = 5; // Maternity
      else                               preferredWardIdx = chance(0.5) ? 0 : 1;       // General A/B

      const ward = wards[preferredWardIdx];
      const freeBed = ward.beds.find(b => b.status === 'available');
      if (!freeBed) continue;
      freeBed.status = 'occupied';
      freeBed.patient = patient._id;
      freeBed.admittedAt = daysAgo(rand(1, 12));
      patient.ward = ward._id;
      patient.bed = freeBed.bedNumber;
      patient.admittedAt = freeBed.admittedAt;
      await patient.save();
      occupiedSoFar.push({ ward, bed: freeBed });
    }
    // Sprinkle some maintenance / reserved beds for realism
    if (wards[0].beds[wards[0].beds.length - 1].status === 'available') wards[0].beds[wards[0].beds.length - 1].status = 'maintenance';
    if (wards[1].beds[wards[1].beds.length - 1].status === 'available') wards[1].beds[wards[1].beds.length - 1].status = 'maintenance';
    if (wards[3].beds[wards[3].beds.length - 1].status === 'available') wards[3].beds[wards[3].beds.length - 1].status = 'reserved';
    if (wards[4].beds[wards[4].beds.length - 1].status === 'available') wards[4].beds[wards[4].beds.length - 1].status = 'reserved';
    if (wards[6].beds[wards[6].beds.length - 1].status === 'available') wards[6].beds[wards[6].beds.length - 1].status = 'maintenance';

    for (const w of wards) await w.save();
    console.log(`✅ ${occupiedSoFar.length} inpatients placed in beds across ${wards.length} wards`);

    // ── Medicines (pharmacy inventory) ───────────────────────────────────
    const medicines = await Medicine.insertMany([
      { name: 'Paracetamol',     genericName: 'Acetaminophen',          brand: 'Panadol',     category: 'tablet',   strength: '500mg',    quantity: 850, minStockLevel: 50, sellingPrice:   5, purchasePrice:  3, requiresPrescription: false, expiryDate: daysFromNow(420), batchNumber: 'BCH-20251', manufacturer: 'GSK',         location: 'A-1' },
      { name: 'Amoxicillin',     genericName: 'Amoxicillin',            brand: 'Amoxil',      category: 'capsule',  strength: '500mg',    quantity: 200, minStockLevel: 30, sellingPrice:  15, purchasePrice:  9, requiresPrescription: true,  expiryDate: daysFromNow( 60), batchNumber: 'BCH-20252', manufacturer: 'GSK',         location: 'A-2' },
      { name: 'Metformin',       genericName: 'Metformin HCl',          brand: 'Glucophage',  category: 'tablet',   strength: '500mg',    quantity:   8, minStockLevel: 20, sellingPrice:   8, purchasePrice:  5, requiresPrescription: true,  expiryDate: daysFromNow(180), batchNumber: 'BCH-20253', manufacturer: 'Merck',       location: 'B-1' }, // low stock
      { name: 'Atorvastatin',    genericName: 'Atorvastatin',           brand: 'Lipitor',     category: 'tablet',   strength: '20mg',     quantity: 320, minStockLevel: 25, sellingPrice:  25, purchasePrice: 15, requiresPrescription: true,  expiryDate: daysFromNow(540), batchNumber: 'BCH-20254', manufacturer: 'Pfizer',      location: 'B-2' },
      { name: 'Normal Saline',   genericName: 'Sodium Chloride',        brand: 'Baxter',      category: 'injection',strength: '0.9%',     quantity:  45, minStockLevel: 50, sellingPrice: 120, purchasePrice: 80, requiresPrescription: true,  expiryDate: daysFromNow(-15), batchNumber: 'BCH-20255', manufacturer: 'Baxter',      location: 'C-1' }, // expired
      { name: 'Omeprazole',      genericName: 'Omeprazole',             brand: 'Prilosec',    category: 'capsule',  strength: '20mg',     quantity: 420, minStockLevel: 40, sellingPrice:  12, purchasePrice:  7, requiresPrescription: true,  expiryDate: daysFromNow(360), batchNumber: 'BCH-20256', manufacturer: 'AstraZeneca', location: 'B-3' },
      { name: 'Amlodipine',      genericName: 'Amlodipine',             brand: 'Norvasc',     category: 'tablet',   strength: '5mg',      quantity: 380, minStockLevel: 30, sellingPrice:  18, purchasePrice: 11, requiresPrescription: true,  expiryDate: daysFromNow(280), batchNumber: 'BCH-20257', manufacturer: 'Pfizer',      location: 'B-4' },
      { name: 'Losartan',        genericName: 'Losartan',               brand: 'Cozaar',      category: 'tablet',   strength: '50mg',     quantity: 280, minStockLevel: 30, sellingPrice:  22, purchasePrice: 13, requiresPrescription: true,  expiryDate: daysFromNow(420), batchNumber: 'BCH-20258', manufacturer: 'MSD',         location: 'B-5' },
      { name: 'Salbutamol',      genericName: 'Salbutamol',             brand: 'Ventolin',    category: 'inhaler',  strength: '100mcg',   quantity:  92, minStockLevel: 15, sellingPrice: 350, purchasePrice:220, requiresPrescription: true,  expiryDate: daysFromNow(220), batchNumber: 'BCH-20259', manufacturer: 'GSK',         location: 'D-1' },
      { name: 'Cetirizine',      genericName: 'Cetirizine',             brand: 'Zyrtec',      category: 'tablet',   strength: '10mg',     quantity: 540, minStockLevel: 40, sellingPrice:   6, purchasePrice:  3, requiresPrescription: false, expiryDate: daysFromNow(500), batchNumber: 'BCH-20260', manufacturer: 'GSK',         location: 'A-3' },
      { name: 'Insulin Glargine',genericName: 'Insulin Glargine',       brand: 'Lantus',      category: 'injection',strength: '100IU/ml', quantity:  18, minStockLevel: 20, sellingPrice: 2200,purchasePrice:1700, requiresPrescription: true,  expiryDate: daysFromNow(150), batchNumber: 'BCH-20261', manufacturer: 'Sanofi',      location: 'C-2' }, // low stock
      { name: 'Aspirin',         genericName: 'Acetylsalicylic Acid',   brand: 'Disprin',     category: 'tablet',   strength: '75mg',     quantity: 510, minStockLevel: 50, sellingPrice:   3, purchasePrice:  2, requiresPrescription: false, expiryDate: daysFromNow(700), batchNumber: 'BCH-20262', manufacturer: 'Reckitt',     location: 'A-4' },
      { name: 'Ibuprofen',       genericName: 'Ibuprofen',              brand: 'Brufen',      category: 'tablet',   strength: '400mg',    quantity: 420, minStockLevel: 40, sellingPrice:   8, purchasePrice:  5, requiresPrescription: false, expiryDate: daysFromNow(310), batchNumber: 'BCH-20263', manufacturer: 'Abbott',      location: 'A-5' },
      { name: 'Ceftriaxone',     genericName: 'Ceftriaxone',            brand: 'Rocephin',    category: 'injection',strength: '1g',       quantity:  62, minStockLevel: 20, sellingPrice: 280, purchasePrice:180, requiresPrescription: true,  expiryDate: daysFromNow( 75), batchNumber: 'BCH-20264', manufacturer: 'Roche',       location: 'C-3' },
      { name: 'Azithromycin',    genericName: 'Azithromycin',           brand: 'Zithromax',   category: 'tablet',   strength: '500mg',    quantity: 175, minStockLevel: 20, sellingPrice:  35, purchasePrice: 22, requiresPrescription: true,  expiryDate: daysFromNow(260), batchNumber: 'BCH-20265', manufacturer: 'Pfizer',      location: 'B-6' },
      { name: 'Diclofenac',      genericName: 'Diclofenac',             brand: 'Voltaren',    category: 'tablet',   strength: '50mg',     quantity: 360, minStockLevel: 30, sellingPrice:  10, purchasePrice:  6, requiresPrescription: true,  expiryDate: daysFromNow(380), batchNumber: 'BCH-20266', manufacturer: 'Novartis',    location: 'B-7' },
      { name: 'Cough Syrup',     genericName: 'Dextromethorphan',       brand: 'Robitussin',  category: 'syrup',    strength: '10mg/5ml', quantity: 110, minStockLevel: 15, sellingPrice: 180, purchasePrice:120, requiresPrescription: false, expiryDate: daysFromNow(410), batchNumber: 'BCH-20267', manufacturer: 'Pfizer',      location: 'E-1' },
      { name: 'Hydrocortisone',  genericName: 'Hydrocortisone',         brand: 'Cortizone',   category: 'ointment', strength: '1%',       quantity:  72, minStockLevel: 10, sellingPrice: 240, purchasePrice:160, requiresPrescription: false, expiryDate: daysFromNow(290), batchNumber: 'BCH-20268', manufacturer: 'Pfizer',      location: 'F-1' },
      { name: 'Eye Drops',       genericName: 'Tobramycin',             brand: 'Tobrex',      category: 'drops',    strength: '0.3%',     quantity:  12, minStockLevel: 15, sellingPrice: 320, purchasePrice:210, requiresPrescription: true,  expiryDate: daysFromNow( 50), batchNumber: 'BCH-20269', manufacturer: 'Alcon',       location: 'F-2' }, // low + expiring
      { name: 'Levothyroxine',   genericName: 'Levothyroxine',          brand: 'Synthroid',   category: 'tablet',   strength: '50mcg',    quantity: 295, minStockLevel: 30, sellingPrice:  14, purchasePrice:  8, requiresPrescription: true,  expiryDate: daysFromNow(470), batchNumber: 'BCH-20270', manufacturer: 'Abbott',      location: 'B-8' },
      { name: 'Pantoprazole',    genericName: 'Pantoprazole',           brand: 'Protonix',    category: 'tablet',   strength: '40mg',     quantity: 240, minStockLevel: 30, sellingPrice:  16, purchasePrice:  9, requiresPrescription: true,  expiryDate: daysFromNow(330), batchNumber: 'BCH-20271', manufacturer: 'Pfizer',      location: 'B-9' },
      { name: 'Clopidogrel',     genericName: 'Clopidogrel',            brand: 'Plavix',      category: 'tablet',   strength: '75mg',     quantity: 160, minStockLevel: 25, sellingPrice:  45, purchasePrice: 28, requiresPrescription: true,  expiryDate: daysFromNow(290), batchNumber: 'BCH-20272', manufacturer: 'Sanofi',      location: 'B-10' },
      { name: 'Metoprolol',      genericName: 'Metoprolol',             brand: 'Lopressor',   category: 'tablet',   strength: '50mg',     quantity: 220, minStockLevel: 30, sellingPrice:  18, purchasePrice: 11, requiresPrescription: true,  expiryDate: daysFromNow(360), batchNumber: 'BCH-20273', manufacturer: 'Novartis',    location: 'B-11' },
      { name: 'Furosemide',      genericName: 'Furosemide',             brand: 'Lasix',       category: 'tablet',   strength: '40mg',     quantity: 180, minStockLevel: 25, sellingPrice:   7, purchasePrice:  4, requiresPrescription: true,  expiryDate: daysFromNow(450), batchNumber: 'BCH-20274', manufacturer: 'Sanofi',      location: 'B-12' },
      { name: 'Warfarin',        genericName: 'Warfarin',               brand: 'Coumadin',    category: 'tablet',   strength: '5mg',      quantity:  95, minStockLevel: 20, sellingPrice:  20, purchasePrice: 12, requiresPrescription: true,  expiryDate: daysFromNow(280), batchNumber: 'BCH-20275', manufacturer: 'BMS',         location: 'B-13', isControlled: true },
      { name: 'Tramadol',        genericName: 'Tramadol',               brand: 'Ultram',      category: 'tablet',   strength: '50mg',     quantity: 110, minStockLevel: 20, sellingPrice:  28, purchasePrice: 17, requiresPrescription: true,  expiryDate: daysFromNow(220), batchNumber: 'BCH-20276', manufacturer: 'Janssen',     location: 'B-14', isControlled: true },
      { name: 'Morphine',        genericName: 'Morphine Sulfate',       brand: 'MS Contin',   category: 'injection',strength: '10mg/ml',  quantity:  35, minStockLevel: 15, sellingPrice: 350, purchasePrice:240, requiresPrescription: true,  expiryDate: daysFromNow(180), batchNumber: 'BCH-20277', manufacturer: 'Purdue',      location: 'C-4', isControlled: true },
      { name: 'ORS Sachet',      genericName: 'Oral Rehydration Salts', brand: 'Pedialyte',   category: 'other',    strength: '20.5g',    quantity: 600, minStockLevel: 100,sellingPrice:  25, purchasePrice: 14, requiresPrescription: false, expiryDate: daysFromNow(560), batchNumber: 'BCH-20278', manufacturer: 'Abbott',      location: 'A-6' },
      { name: 'Vitamin D3',      genericName: 'Cholecalciferol',        brand: 'D-Plus',      category: 'capsule',  strength: '50000IU',  quantity: 320, minStockLevel: 40, sellingPrice:  35, purchasePrice: 20, requiresPrescription: false, expiryDate: daysFromNow(620), batchNumber: 'BCH-20279', manufacturer: 'Sanofi',      location: 'A-7' },
      { name: 'Multivitamin',    genericName: 'Multivitamins',          brand: 'Centrum',     category: 'tablet',   strength: 'Standard', quantity: 410, minStockLevel: 50, sellingPrice:  18, purchasePrice: 11, requiresPrescription: false, expiryDate: daysFromNow(700), batchNumber: 'BCH-20280', manufacturer: 'Pfizer',      location: 'A-8' },
      { name: 'Iron Sucrose',    genericName: 'Iron Sucrose',           brand: 'Venofer',     category: 'injection',strength: '100mg/5ml',quantity:  48, minStockLevel: 15, sellingPrice: 580, purchasePrice:380, requiresPrescription: true,  expiryDate: daysFromNow(310), batchNumber: 'BCH-20281', manufacturer: 'Vifor',       location: 'C-5' },
      { name: 'Folic Acid',      genericName: 'Folic Acid',             brand: 'Folvite',     category: 'tablet',   strength: '5mg',      quantity: 380, minStockLevel: 50, sellingPrice:   3, purchasePrice:  2, requiresPrescription: false, expiryDate: daysFromNow(540), batchNumber: 'BCH-20282', manufacturer: 'Wyeth',       location: 'A-9' },
      { name: 'Glimepiride',     genericName: 'Glimepiride',            brand: 'Amaryl',      category: 'tablet',   strength: '2mg',      quantity: 175, minStockLevel: 30, sellingPrice:  22, purchasePrice: 13, requiresPrescription: true,  expiryDate: daysFromNow(280), batchNumber: 'BCH-20283', manufacturer: 'Sanofi',      location: 'B-15' },
      { name: 'Sertraline',      genericName: 'Sertraline',             brand: 'Zoloft',      category: 'tablet',   strength: '50mg',     quantity: 130, minStockLevel: 20, sellingPrice:  32, purchasePrice: 19, requiresPrescription: true,  expiryDate: daysFromNow(380), batchNumber: 'BCH-20284', manufacturer: 'Pfizer',      location: 'B-16' },
      { name: 'Diazepam',        genericName: 'Diazepam',               brand: 'Valium',      category: 'tablet',   strength: '5mg',      quantity:  85, minStockLevel: 25, sellingPrice:  15, purchasePrice:  9, requiresPrescription: true,  expiryDate: daysFromNow(220), batchNumber: 'BCH-20285', manufacturer: 'Roche',       location: 'B-17', isControlled: true },
    ]);
    console.log(`✅ ${medicines.length} medicines created`);

    // ── Appointments ─────────────────────────────────────────────────────
    const COMPLAINTS = [
      { c: 'Chest pain and shortness of breath',    s: ['chest pain','shortness of breath','palpitations'], dx: 'Stable angina',                    rx: ['Atorvastatin','Aspirin','Amlodipine'],     dept: 'Cardiology' },
      { c: 'Fever and persistent cough',            s: ['fever','cough','fatigue','sore throat'],          dx: 'Acute bronchitis',                  rx: ['Azithromycin','Cough Syrup','Paracetamol'],dept: 'General Medicine' },
      { c: 'Severe headache for 3 days',            s: ['headache','nausea','sensitivity to light'],       dx: 'Migraine without aura',             rx: ['Paracetamol','Diclofenac'],                dept: 'Neurology' },
      { c: 'Joint pain in knees',                   s: ['joint pain','swelling','stiffness'],              dx: 'Osteoarthritis',                    rx: ['Diclofenac','Ibuprofen'],                  dept: 'Orthopedics' },
      { c: 'Routine pediatric checkup',             s: ['routine'],                                        dx: 'Healthy — vaccinations on schedule', rx: [],                                          dept: 'Pediatrics' },
      { c: 'High blood pressure follow-up',         s: ['fatigue','occasional dizziness'],                 dx: 'Essential hypertension',            rx: ['Losartan','Amlodipine'],                   dept: 'Cardiology' },
      { c: 'Diabetes follow-up',                    s: ['fatigue','frequent urination'],                   dx: 'Type 2 Diabetes Mellitus',          rx: ['Metformin','Insulin Glargine'],            dept: 'General Medicine' },
      { c: 'Acute abdominal pain',                  s: ['abdominal pain','nausea','vomiting'],             dx: 'Acute gastritis',                   rx: ['Omeprazole','Paracetamol'],                dept: 'General Medicine' },
      { c: 'Skin rash and itching',                 s: ['rash','itching','redness'],                       dx: 'Allergic dermatitis',               rx: ['Cetirizine','Hydrocortisone'],             dept: 'Dermatology' },
      { c: 'Difficulty breathing during exertion',  s: ['shortness of breath','wheezing'],                 dx: 'Mild persistent asthma',            rx: ['Salbutamol'],                              dept: 'General Medicine' },
      { c: 'Lower back pain',                       s: ['back pain','stiffness'],                          dx: 'Lumbar strain',                     rx: ['Ibuprofen','Diclofenac'],                  dept: 'Orthopedics' },
      { c: 'Eye irritation and discharge',          s: ['eye redness','discharge','tearing'],              dx: 'Bacterial conjunctivitis',          rx: ['Eye Drops'],                               dept: 'Ophthalmology' },
      { c: 'Sore throat and ear pain',              s: ['sore throat','ear pain','difficulty swallowing'], dx: 'Acute tonsillitis with otitis media', rx: ['Amoxicillin','Paracetamol'],             dept: 'ENT' },
      { c: 'Pregnancy follow-up — second trimester', s: ['routine antenatal'],                             dx: 'Normal pregnancy — 22 weeks',       rx: ['Folic Acid','Iron Sucrose','Multivitamin'], dept: 'Obstetrics & Gynecology' },
      { c: 'Acne flare-up on face and back',        s: ['pimples','oily skin','scarring'],                 dx: 'Moderate acne vulgaris',            rx: ['Azithromycin','Hydrocortisone'],           dept: 'Dermatology' },
      { c: 'Persistent low mood and insomnia',      s: ['sad mood','insomnia','low energy'],               dx: 'Major depressive disorder, mild',   rx: ['Sertraline'],                              dept: 'Psychiatry' },
      { c: 'Vision blurring and eye strain',        s: ['blurred vision','headache'],                      dx: 'Refractive error — myopia',         rx: [],                                          dept: 'Ophthalmology' },
      { c: 'Heart palpitations and anxiety',        s: ['palpitations','anxiety'],                         dx: 'Generalized anxiety disorder',      rx: ['Sertraline','Diazepam'],                   dept: 'Psychiatry' },
      { c: 'Recurrent UTI symptoms',                s: ['burning urination','frequency'],                  dx: 'Uncomplicated UTI',                 rx: ['Ceftriaxone','Paracetamol'],               dept: 'General Medicine' },
      { c: 'Swelling in legs',                      s: ['edema','shortness of breath'],                    dx: 'Mild congestive heart failure',     rx: ['Furosemide','Metoprolol'],                 dept: 'Cardiology' },
    ];
    const apptsByDoctorDate = new Set(); // dedupe (doctor, date, slot)
    const appointments = [];
    const TARGET_APPTS = 260;
    for (let i = 0; i < TARGET_APPTS; i++) {
      const offset = rand(-180, 21);  // ~6 months past, 3 weeks future
      const date   = offset >= 0 ? daysFromNow(offset) : daysAgo(-offset);
      const dow    = date.getDay();
      if (dow === 0) continue; // skip Sundays

      let status;
      if (offset < -3)        status = pick(['completed','completed','completed','completed','completed','no-show','cancelled']);
      else if (offset <= 0)   status = pick(['completed','in-progress','confirmed']);
      else if (offset <= 1)   status = pick(['scheduled','confirmed']);
      else                    status = 'scheduled';

      const patient = pick(patients);
      const ct      = pick(COMPLAINTS);
      // Pick a doctor whose department matches the complaint when possible
      const matchingDocs = doctors.filter(d => d.department === ct.dept);
      const doctor  = matchingDocs.length ? pick(matchingDocs) : pick(doctors);
      const timeSlot = pick(TIME_SLOTS);
      const dedupKey = `${doctor._id}-${date.toDateString()}-${timeSlot}`;
      if (apptsByDoctorDate.has(dedupKey)) continue;
      apptsByDoctorDate.add(dedupKey);

      const isCompleted = status === 'completed';
      const apptCreatedAt = offset < 0 ? daysAgo(-offset + rand(0, 2)) : daysAgo(rand(0, 7));

      const appt = await Appointment.create({
        patient: patient._id,
        doctor:  doctor._id,
        date,
        timeSlot,
        type: pick(['consultation','consultation','consultation','consultation','follow-up','checkup','procedure']),
        status,
        priority: chance(0.85) ? 'normal' : pick(['urgent','critical']),
        chiefComplaint: ct.c,
        symptoms: ct.s,
        diagnosis: isCompleted ? ct.dx : undefined,
        prescription: isCompleted ? ct.rx.map(med => ({
          medicine: med,
          dosage: pick(['250mg','500mg','10mg','20mg','100mg']),
          frequency: pick(['Once daily','Twice daily','Thrice daily','At bedtime']),
          duration: pick(['3 days','5 days','7 days','14 days','1 month'])
        })) : [],
        bookedBy: pick([admin, ...staffUsers])._id,
        fee: doctor.consultationFee,
        isPaid: isCompleted ? chance(0.7) : false,
        followUpDate: isCompleted && chance(0.3) ? daysFromNow(rand(7, 60)) : undefined,
        createdAt: apptCreatedAt,
      });
      appointments.push(appt);
    }
    console.log(`✅ ${appointments.length} appointments created`);

    // ── Lab tests (mix of states; many linked to a real appointment) ─────
    const TEST_TEMPLATES = [
      {
        name: 'Complete Blood Count (CBC)', category: 'hematology', sampleType: 'Blood (EDTA)', price: 800,
        results: () => [
          { parameter: 'Hemoglobin',           value: (12 + Math.random()*4).toFixed(1), unit: 'g/dL',    normalRange: '13.5-17.5', flag: chance(0.7) ? 'normal' : 'low' },
          { parameter: 'WBC',                  value: (5 + Math.random()*6).toFixed(1),  unit: '10³/µL',  normalRange: '4.5-11.0',  flag: chance(0.8) ? 'normal' : 'high' },
          { parameter: 'Platelets',            value: String(rand(180, 380)),            unit: '10³/µL',  normalRange: '150-450',   flag: 'normal' },
          { parameter: 'Hematocrit',           value: (38 + Math.random()*8).toFixed(1), unit: '%',       normalRange: '38.3-48.6', flag: 'normal' },
        ]
      },
      {
        name: 'Liver Function Test (LFT)', category: 'biochemistry', sampleType: 'Blood (Serum)', price: 1500,
        results: () => [
          { parameter: 'ALT (SGPT)',  value: String(rand(15, 60)),  unit: 'U/L',     normalRange: '7-56',   flag: chance(0.7) ? 'normal' : 'high' },
          { parameter: 'AST (SGOT)',  value: String(rand(10, 50)),  unit: 'U/L',     normalRange: '10-40',  flag: 'normal' },
          { parameter: 'Bilirubin',   value: (0.4 + Math.random()*1.5).toFixed(2), unit: 'mg/dL', normalRange: '0.1-1.2', flag: 'normal' },
          { parameter: 'Albumin',     value: (3.5 + Math.random()*1.5).toFixed(1), unit: 'g/dL',  normalRange: '3.5-5.0', flag: 'normal' },
        ]
      },
      {
        name: 'Lipid Profile', category: 'biochemistry', sampleType: 'Blood (Serum)', price: 1800,
        results: () => [
          { parameter: 'Total Cholesterol', value: String(rand(150, 260)), unit: 'mg/dL', normalRange: '<200', flag: chance(0.6) ? 'normal' : 'high' },
          { parameter: 'HDL',               value: String(rand(35, 65)),   unit: 'mg/dL', normalRange: '>40',  flag: 'normal' },
          { parameter: 'LDL',               value: String(rand(80, 180)),  unit: 'mg/dL', normalRange: '<100', flag: chance(0.5) ? 'normal' : 'high' },
          { parameter: 'Triglycerides',     value: String(rand(80, 250)),  unit: 'mg/dL', normalRange: '<150', flag: chance(0.6) ? 'normal' : 'high' },
        ]
      },
      {
        name: 'HbA1c', category: 'biochemistry', sampleType: 'Blood (EDTA)', price: 1200,
        results: () => [
          { parameter: 'HbA1c', value: (5.2 + Math.random()*3.5).toFixed(1), unit: '%', normalRange: '<5.7', flag: chance(0.4) ? 'high' : 'normal' },
        ]
      },
      {
        name: 'Urine R/E', category: 'urine', sampleType: 'Urine', price: 400,
        results: () => [
          { parameter: 'Color',      value: 'Yellow',       unit: '',       normalRange: 'Yellow',     flag: 'normal' },
          { parameter: 'pH',         value: String((5 + Math.random()*3).toFixed(1)), unit: '', normalRange: '4.5-8.0', flag: 'normal' },
          { parameter: 'Protein',    value: chance(0.7) ? 'Negative' : 'Trace', unit: '', normalRange: 'Negative', flag: chance(0.7) ? 'normal' : 'high' },
          { parameter: 'Glucose',    value: 'Negative',     unit: '',       normalRange: 'Negative',   flag: 'normal' },
        ]
      },
      { name: 'Chest X-Ray',                category: 'radiology',    sampleType: 'Imaging',                price: 1500, results: () => [{ parameter: 'Findings', value: 'No active lung pathology', unit: '', normalRange: 'Clear',  flag: 'normal' }] },
      { name: 'COVID-19 PCR',               category: 'microbiology', sampleType: 'Nasopharyngeal Swab',    price: 4500, results: () => [{ parameter: 'SARS-CoV-2 RNA', value: 'Not Detected',              unit: '', normalRange: 'Not Detected', flag: 'normal' }] },
      { name: 'Thyroid Profile (TSH/T3/T4)',category: 'biochemistry', sampleType: 'Blood (Serum)',          price: 2200, results: () => [
        { parameter: 'TSH', value: (0.5 + Math.random()*5).toFixed(2), unit: 'mIU/L', normalRange: '0.4-4.0', flag: chance(0.7) ? 'normal' : 'high' },
        { parameter: 'T3',  value: (80 + Math.random()*100).toFixed(0), unit: 'ng/dL', normalRange: '80-200', flag: 'normal' },
        { parameter: 'T4',  value: (5 + Math.random()*7).toFixed(1),    unit: 'µg/dL', normalRange: '5.0-12.0', flag: 'normal' },
      ] },
      { name: 'ECG',                        category: 'other',        sampleType: 'Tracing',                 price:  600, results: () => [{ parameter: 'Rhythm', value: pick(['Normal sinus rhythm','Sinus tachycardia']), unit: '', normalRange: 'NSR', flag: 'normal' }] },
      { name: 'Abdominal Ultrasound',       category: 'radiology',    sampleType: 'Imaging',                 price: 2500, results: () => [{ parameter: 'Findings', value: 'Unremarkable abdominal organs', unit: '', normalRange: 'Normal', flag: 'normal' }] },
      { name: 'Vitamin D (25-OH)',          category: 'biochemistry', sampleType: 'Blood (Serum)',           price: 1800, results: () => [{ parameter: 'Vitamin D', value: String(rand(8, 60)), unit: 'ng/mL', normalRange: '30-100', flag: chance(0.55) ? 'low' : 'normal' }] },
      { name: 'Stool R/E',                  category: 'pathology',    sampleType: 'Stool',                   price:  500, results: () => [{ parameter: 'Occult blood', value: chance(0.9) ? 'Negative' : 'Positive', unit: '', normalRange: 'Negative', flag: 'normal' }] },
    ];

    const labTests = [];
    const TARGET_TESTS = 120;
    // Choose a pool of completed appointments to attach test orders to.
    const completedAppointmentsForLabs = appointments.filter(a => a.status === 'completed');
    for (let i = 0; i < TARGET_TESTS; i++) {
      const tpl = pick(TEST_TEMPLATES);
      // 60% of tests are linked to a completed appointment
      const linkedAppt = chance(0.6) && completedAppointmentsForLabs.length
        ? pick(completedAppointmentsForLabs) : null;
      const orderedDaysAgo = linkedAppt
        ? Math.max(0, Math.floor((Date.now() - linkedAppt.date.getTime()) / 86400000) - rand(0, 1))
        : rand(0, 90);
      const r = Math.random();
      const status = r < 0.45 ? 'completed'
                   : r < 0.6  ? 'processing'
                   : r < 0.78 ? 'sample-collected'
                   : r < 0.95 ? 'ordered'
                   : 'cancelled';
      const isCompleted = status === 'completed';
      const isCollected = ['sample-collected','processing','completed'].includes(status);

      const test = await LabTest.create({
        patient:   linkedAppt ? linkedAppt.patient : pick(patients)._id,
        orderedBy: linkedAppt ? linkedAppt.doctor  : pick(doctors)._id,
        appointment: linkedAppt?._id,
        testName:  tpl.name,
        category:  tpl.category,
        sampleType:tpl.sampleType,
        urgency:   chance(0.7) ? 'routine' : chance(0.5) ? 'urgent' : 'stat',
        status,
        sampleCollectedAt: isCollected ? daysAgo(Math.max(0, orderedDaysAgo - 1)) : undefined,
        collectedBy:       isCollected ? pick([staffUsers[3], staffUsers[9]])._id : undefined,
        results:           isCompleted ? tpl.results() : [],
        resultNotes:       isCompleted ? 'Results within expected ranges. Clinical correlation advised.' : undefined,
        completedAt:       isCompleted ? daysAgo(Math.max(0, orderedDaysAgo - 2)) : undefined,
        verifiedBy:        isCompleted ? pick([staffUsers[3], staffUsers[9]])._id : undefined,
        price:             tpl.price,
        isPaid:            isCompleted && chance(0.7),
        createdAt:         daysAgo(orderedDaysAgo),
      });
      labTests.push(test);

      // Link the test back into the appointment so /appointments/:id shows it.
      if (linkedAppt) {
        linkedAppt.labTests = linkedAppt.labTests || [];
        if (linkedAppt.labTests.length < 5) {
          linkedAppt.labTests.push(test._id);
          await linkedAppt.save();
        }
      }
    }
    console.log(`✅ ${labTests.length} lab tests created (${labTests.filter(t => t.appointment).length} linked to appointments)`);

    // ── Invoices ─────────────────────────────────────────────────────────
    const completedAppts = appointments.filter(a => a.status === 'completed');
    const invoices = [];
    // One invoice per completed appointment, plus extra invoices for inpatients/lab walk-ins.
    const TARGET_INVOICES = Math.min(150, completedAppts.length + 30);

    for (let i = 0; i < TARGET_INVOICES; i++) {
      const linkedAppt = i < completedAppts.length ? completedAppts[i] : null;
      const patient = linkedAppt
        ? patients.find(p => String(p._id) === String(linkedAppt.patient))
        : pick(patients);

      const doctorFee = linkedAppt
        ? linkedAppt.fee
        : pick(doctors).consultationFee;

      const lineItems = [
        { description: 'Doctor Consultation', category: 'consultation', quantity: 1, unitPrice: doctorFee, discount: 0, tax: 0 },
      ];
      if (chance(0.6)) lineItems.push({ description: pick(['CBC','Lipid Profile','LFT','Urine R/E','HbA1c','Thyroid Profile']),  category: 'lab',       quantity: 1,         unitPrice: rand(400, 2200),  discount: 0, tax: 0 });
      if (chance(0.5)) lineItems.push({ description: 'Medication',                                                              category: 'medicine',  quantity: rand(1,3), unitPrice: rand(50, 600),    discount: 0, tax: 0 });
      if (chance(0.2)) lineItems.push({ description: 'IV Fluids and Nursing Care',                                              category: 'nursing',   quantity: rand(1,3), unitPrice: 1500,             discount: 0, tax: 0 });
      if (chance(0.1)) lineItems.push({ description: 'Day-care Procedure',                                                      category: 'procedure', quantity: 1,         unitPrice: rand(3000, 12000),discount: 0, tax: 0 });
      if (chance(0.05)) lineItems.push({ description: 'Minor Surgery (Suturing/Drainage)',                                       category: 'surgery',   quantity: 1,         unitPrice: rand(5000, 25000),discount: 0, tax: 0 });
      if (patient.status === 'inpatient' || patient.status === 'discharged' || patient.status === 'critical') {
        lineItems.push({ description: `Bed Charges (${rand(2, 9)} days)`, category: 'bed', quantity: rand(2, 9), unitPrice: pick([2000, 2500, 5000, 8000]), discount: 0, tax: 0 });
      }

      let subtotal = 0;
      for (const it of lineItems) {
        it.total = it.quantity * it.unitPrice * (1 - (it.discount||0)/100) * (1 + (it.tax||0)/100);
        subtotal += it.quantity * it.unitPrice;
      }
      const grandTotal = lineItems.reduce((s, it) => s + it.total, 0);

      const r = Math.random();
      const paymentScenario = r < 0.55 ? 'paid' : r < 0.78 ? 'partial' : 'unpaid';
      const payments = [];
      if (paymentScenario === 'paid') {
        payments.push({
          amount: grandTotal, method: pick(['cash','card','online','insurance']),
          transactionId: `TXN-${rand(100000, 999999)}`,
          paidAt: linkedAppt ? linkedAppt.date : daysAgo(rand(0, 180)),
          receivedBy: pick([staffUsers[1], staffUsers[8]])._id,
        });
      } else if (paymentScenario === 'partial') {
        payments.push({
          amount: Math.round(grandTotal * (0.3 + Math.random() * 0.4)),
          method: pick(['cash','card','online']),
          transactionId: `TXN-${rand(100000, 999999)}`,
          paidAt: linkedAppt ? linkedAppt.date : daysAgo(rand(0, 180)),
          receivedBy: pick([staffUsers[1], staffUsers[8]])._id,
        });
      }

      const insurance = patient.insurance && chance(0.5) ? {
        provider: patient.insurance.provider, policyNumber: patient.insurance.policyNumber,
        claimNumber: `CLM-${rand(10000, 99999)}`,
        coveredAmount: paymentScenario === 'paid' ? Math.round(grandTotal * 0.3) : 0,
        status: pick(['pending','approved','partial']),
      } : { coveredAmount: 0, status: 'pending' };

      const inv = await Invoice.create({
        patient: patient._id,
        appointment: linkedAppt?._id,
        lineItems, subtotal, discountTotal: 0, taxTotal: 0, grandTotal,
        insurance, payments,
        dueDate: daysFromNow(rand(-15, 30)),
        createdBy: pick([admin, staffUsers[1], staffUsers[4], staffUsers[8]])._id,
        createdAt: linkedAppt ? linkedAppt.date : daysAgo(rand(0, 180)),
        notes: chance(0.25) ? pick([
          'Self-pay with employer reimbursement.',
          'Insurance pre-authorization on file.',
          'Patient requested itemized receipt.',
          'Discount applied per management approval.'
        ]) : undefined,
      });
      invoices.push(inv);

      // Link the invoice back to the appointment record
      if (linkedAppt && !linkedAppt.invoice) {
        linkedAppt.invoice = inv._id;
        linkedAppt.isPaid = paymentScenario === 'paid';
        await linkedAppt.save();
      }
    }
    console.log(`✅ ${invoices.length} invoices created`);

    // ── Done ─────────────────────────────────────────────────────────────
    const totalRev = invoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const paidCount    = invoices.filter(i => i.paymentStatus === 'paid').length;
    const partialCount = invoices.filter(i => i.paymentStatus === 'partial').length;
    const unpaidCount  = invoices.filter(i => i.paymentStatus === 'unpaid').length;
    const occupiedBeds = wards.reduce((s, w) => s + w.beds.filter(b => b.status === 'occupied').length, 0);
    const totalBeds    = wards.reduce((s, w) => s + w.beds.length, 0);

    console.log('\n🎉 Database seeded successfully!');
    console.log('='.repeat(60));
    console.log('Summary');
    console.log(`  Users:        ${1 + docUsers.length + staffUsers.length} (1 admin + ${docUsers.length} doctors + ${staffUsers.length} staff)`);
    console.log(`  Doctors:      ${doctors.length}`);
    console.log(`  Patients:     ${patients.length} (${inpatients.length} inpatient/critical/observation)`);
    console.log(`  Wards:        ${wards.length} (${occupiedBeds}/${totalBeds} beds occupied)`);
    console.log(`  Medicines:    ${medicines.length} (${medicines.filter(m => m.quantity <= m.minStockLevel).length} low stock, ${medicines.filter(m => m.expiryDate < new Date()).length} expired)`);
    console.log(`  Appointments: ${appointments.length} (${completedAppts.length} completed)`);
    console.log(`  Lab Tests:    ${labTests.length}`);
    console.log(`  Invoices:     ${invoices.length} — paid: ${paidCount}, partial: ${partialCount}, unpaid: ${unpaidCount}`);
    console.log(`  Revenue:      Rs ${totalRev.toLocaleString()} total received`);
    console.log('='.repeat(60));
    console.log('\nLogin credentials:');
    console.log('  Admin:         admin@hospital.com           / Admin@123');
    console.log('  Doctor:        dr.ahmed@hospital.com        / Doctor@123');
    console.log('  Doctor:        dr.sara@hospital.com         / Doctor@123');
    console.log('  Doctor:        dr.omar@hospital.com         / Doctor@123');
    console.log('  Doctor:        dr.hina@hospital.com         / Doctor@123');
    console.log('  Nurse:         nurse.ayesha@hospital.com    / Nurse@123');
    console.log('  Receptionist:  reception.ali@hospital.com   / Reception@123');
    console.log('  Pharmacist:    pharmacy.usman@hospital.com  / Pharmacy@123');
    console.log('  Lab Tech:      lab.zara@hospital.com        / Lab@12345');
    console.log('  Accountant:    accounts.hassan@hospital.com / Account@123');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  }
};

seed();
