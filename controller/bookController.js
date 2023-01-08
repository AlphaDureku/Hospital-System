const mail = require('nodemailer')
const doctor = require('../Models/Database_Queries/doctor_query')
const insert = require('../Models/Database_Queries/insert_query')
const patient = require('../Models/Database_Queries/patient_query')
const Title = require('../Models/Object_Models/Title')
const uuid = require('uuid');
const e = require('cors')





exports.renderClinicPage = async(req, res) => {
    req.session.patientModel.appointmentType = "Clinic"
    res.render('Services/clinic', { layout: 'layouts/sub', Title: Title.Clinic })
}
exports.renderOutpatientPage = async(req, res) => {
    req.session.patientModel.appointmentType = "Outpatient"
    res.render('Services/outpatient', { layout: 'layouts/sub', Title: Title.Outpatient })
}
exports.createPatientModel = function(req, res, next) {
    req.session.patientModel = {
        patientID: uuid.v4(),
        Fname: "",
        Mname: "",
        Lname: "",
        dateOfBirth: "",
        contactNumber: "",
        address: "",
        gender: "",
        appointmentType: "",
        doctor_schedule_ID: "",
    }
    next()
}


exports.sendOTP = async(req, res) => {
    sendEmail(req.session.Patient.Email, req.session.Patient.OTP)
    res.end()
}
exports.compareOTP = async(req, res) => {
    patient.findUserUsingEmail(req.session.Patient.Email)
    let Patient = {
        inputOTP: req.body.inputOTP,
        User_ID: '',
        isVerified: false,
        hasHistory: false,
        patientList: {}
    }
    req.session.user_ID = await patient.findUserUsingEmail(req.session.Patient.Email)
    Patient.User_ID = req.session.user_ID
    if (Patient.User_ID != null) {
        req.session.UserPatients = await patient.fetch_User_Patients(Patient.User_ID.user_ID)
    }
    if (req.session.UserPatients != null) {
        Patient.patientList = req.session.UserPatients.rows
        Patient.hasHistory = true
    }
    if (Patient.inputOTP == req.session.Patient.OTP) {
        Patient.isVerified = true
    }
    res.send(Patient)
}
exports.generateOTP = function(req, res, next) {
    const hashed = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    req.session.Patient = {
        Email: req.body.patient_Email,
        OTP: hashed
    }
    next()
}

exports.userExists = async(req, res) => {
    req.session.patient_ID = req.body.choice
    if (req.session.patientID != '') {
        res.redirect('choose-doctor')
    }
    res.render('Services/patient-forms', { layout: 'layouts/sub', Title: Title.PatientInformation })
}

exports.renderPatientForm = async(req, res) => {
    if (req.session.user_ID != null) {
        console.log(req.session.UserPatients)
        res.render('go to page and ash if they wanted to use a patient registered with their email, if yes then save req.session.patient_ID, if no proceed to else')
    } else {
        console.log('new User or new Patient')
        res.render('Services/patient-forms', { layout: 'layouts/sub', Title: Title.PatientInformation })
    }
}
exports.getPatientInfo = async(req, res) => {
    req.session.patientModel.Fname = req.body.Fname
    req.session.patientModel.Lname = req.body.Lname
    req.session.patientModel.Mname = req.body.Mname
    req.session.patientModel.address = req.body.address
    req.session.patientModel.contactNumber = req.body.contactNumber
    req.session.patientModel.dateOfBirth = req.body.dateOfBirth
    req.session.patientModel.gender = req.body.gender
    res.redirect('choose-doctor')
}
exports.renderDoctorList = async(req, res) => {
    const result = await doctor.getDoctor()
    const schedule = await doctor.getSchedule()
    res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, layout: 'layouts/sub', Title: Title.ChooseDoctor })
}
exports.searchDoctor = async(req, res) => {
    let searchOption = {
        Fname: req.query.doctor_Fname,
        Lname: req.query.doctor_Lname,
        Specialization: req.query.specialization,
        doctor_HMO: req.query.doctor_HMO
    }
    console.log(searchOption.Fname)
        //ALL
    if (!searchOption.Fname && !searchOption.Lname && !searchOption.Specialization && !searchOption.doctor_HMO) {
        const result = await doctor.getDoctor()
        const schedule = await doctor.getSchedule()
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
            //Using specs only
    } else if ((!searchOption.Fname && !searchOption.Lname) && (searchOption.Specialization != undefined && searchOption.doctor_HMO != undefined)) {
        console.log("get by spec and sub_spec only")
        const result = await doctor.getDoctor_Using_Spec_SubSpec_HMO(searchOption)
        const schedule = await doctor.getSchedule_Using_Spec_SubSpec_HMO(searchOption)
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
    } else if ((searchOption.Fname != undefined || searchOption.Lname != undefined) && (searchOption.Specialization || searchOption.doctor_HMO)) {
        console.log("get by Name, spec and sub_spec")
        const result = await doctor.getDoctor_Using_All(searchOption);
        const schedule = await doctor.getSchedule_Using_All(searchOption)
        console.log(result)
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
    } else if (searchOption.Fname && searchOption.Lname) {
        console.log("get by Fname Lname")
        const result = await doctor.getDoctor_Using_Fname_Lname(searchOption)
        const schedule = await doctor.getSchedule_Using_Fname_Lname(searchOption)
        console.log("get by Fname Lname")
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
    } else if (searchOption.Lname) {
        console.log("get by LName")
        const result = await doctor.getDoctor_Using_Lname(searchOption)
        const schedule = await doctor.getSchedule_Using_Lname(searchOption)
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
    } else if (searchOption.Fname) {
        console.log("get by FName")
        const result = await doctor.getDoctor_Using_Fname(searchOption)
        const schedule = await doctor.getSchedule_Using_Fname(searchOption)
        res.render('Services/choose-doctor', { queriedDoctors: result, queriedSchedule: schedule, retainDoctorQuery: searchOption, layout: 'layouts/sub', Title: Title.ChooseDoctor })
    } else {
        console.log("Undefined")
        res.render('Services/choose-doctor')
    }

}
exports.renderSchedule = async(req, res) => {
    const result = await doctor.getOneDoctor(req.session.doctor)
    res.send(result)
}
exports.renderSchedule2 = async(req, res) => {
    const result = await doctor.getOneDoctor2(req.session.doctor)
    res.send(result)
}
exports.chooseSchedule = async(req, res) => {
    req.session.doctor = req.query.doctor
    res.render('Services/choose-schedule', { layout: 'layouts/sub', Title: 'Choose Schedule' })
}

exports.getReceipt = async(req, res) => {
    req.session.patientModel.doctor_schedule_ID = req.query.doctor_schedule_ID
    const result = await patient.getReceipt(req.query.doctor_schedule_ID)
    console.log(result)
    res.send(result[0])
}

exports.setAppointment = async(req, res) => {
    const queue_number = await doctor.getQueueInstance(req.body.doctor_schedule_id)
    if (req.session.user_ID == null) {
        req.session.user_ID = await insert.insert_user(req.session.Patient.Email)
    }

    if (req.session.patient_ID == undefined) {
        patientParams = {
            user_ID: req.session.user_ID,
            Fname: req.session.patientModel.Fname,
            Lname: req.session.patientModel.Lname,
            Mname: req.session.patientModel.Mname,
            birth: req.session.patientModel.dateOfBirth,
            address: req.session.patientModel.address,
            gender: req.session.patientModel.gender,
            contact: req.session.patientModel.contactNumber
        }
        console.log(patientParams)
        req.session.patient_ID = await insert.insertPatient(patientParams)
        console.log(req.session.patient_ID)
    }
    appointmentParams = {
        patient_ID: req.session.patient_ID,
        doctorSchedule_ID: req.body.doctor_schedule_id,
        doctor_ID: req.session.doctor,
        queue: queue_number,
        type: req.session.patientModel.appointmentType
    }
    req.session.appointment_ID = await insert.insertAppointmentDetails(appointmentParams)
    doctor.incrementQueue(appointmentParams.doctorSchedule_ID)
    res.end()
}


exports.FinalStep = async(req, res) => {
    const result = await patient.getappointmentDetails(req.session.appointment_ID)
    console.log(result)
    res.render('Services/Last-step', { final: result, layout: 'layouts/sub', Title: 'Finishing' })
}

// Send Email Process
const sendEmail = (email, otp) => {
    async function main() {
        let testAccount = await mail.createTestAccount();
        let transporter = mail.createTransport({
            service: 'gmail',
            secure: false,
            auth: {
                user: 'templanzamark2002@gmail.com',
                pass: 'koaowdqdigdcujwr',
            },
        });
        let info = await transporter.sendMail({
            from: '"templanzamark2002@gmail.com', // sender address
            to: email, // list of receivers
            subject: "Security Verification", // Subject line
            html: "<b>" + otp + "</b>", // html body
        });
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    }

    main().catch(console.error);
}