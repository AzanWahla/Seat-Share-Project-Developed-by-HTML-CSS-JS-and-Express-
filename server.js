//FA22-BSE-105 (Azan Wahla)
//FA22-BSE-153 (M Waqar ul Mulk)
//FA22-BSE-137 (Umair Ali)

const express = require('express');
const {Sequelize} = require('sequelize');
const bodyParser = require('body-parser');
const path = require('path');
const perf_hooks = require("node:perf_hooks");
// const {query} = require("express");

const app = express();
const port = 9090;
// const exec = require('child_process').exec;
const database = new Sequelize('seatShare', 'root', 'umair12345', {
    host: 'localhost',
    dialect: 'mysql'
});

app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'pages')));

// console.log(__dirname);
let l_email;

app.get('/', async (req, res) => {
    await database.authenticate().then(() => {
        console.log('Connection established successfully');
    }).catch(err => {
        console.log(err);
        process.exit();
    });
    // res.render('index.pug');
    res.sendFile(path.join(__dirname, 'pages', 'home.html'));
});

app.get('/signup_rider', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'userSignup.html'));
});

app.post('/signup_rider_submit', async (req, res) => {
    const {firstName, lastName, gender, address, city, email, password} = req.body;
    const query = `INSERT INTO rider (firstName,lastName,gender,address,city,email,password) VALUES ('${firstName}','${lastName}','${gender}','${address}','${city}','${email}', '${password}')`;
    console.log(query);
    await database.query(query).then((result) => {
        console.log(result);
        res.status(200).send('Rider Signed Up Successfully');
    }).catch(err => {
        console.log(err);
        res.status(500).send('Error Occurred');
    });
});

app.get('/signing_rider', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'userLogin.html'));
});

app.post('/signing_rider_submission', async (req, res) => {
    const {email, password} = req.body;
    // console.log(email);
    // console.log(password);
    l_email = email;
    const query = `SELECT email,password FROM rider;`;
    const [result, metadata] = await database.query(query);
    // console.log(result);
    if (result.find(e => e.email === email && e.password === password)) {
        console.log("Matched");
        res.status(200).json({message: 'Rider Logged In Successfully'});
    } else {
        res.status(500).json({message: 'Invalid Credentials'});
    }
});

app.post('/signing_driver_submission', async (req, res) => {
    const {email, password} = req.body;

    l_email = email;

    const query = `SELECT email,password FROM driver;`;
    const [result, metadata] = await database.query(query);

    if (result.find(e => e.email === email && e.password === password)) {
        res.status(200).json({message: 'Driver Logged In Successfully'});
    } else {
        res.status(500).json({message: 'Invalid Credentials'});
    }

});

let id;

app.get('/update/:id', async (req, res) => {
    id = req.params.id;
    res.sendFile(path.join(__dirname, 'pages', 'update.html'));
});

app.put('/update/:id', async (req, res) => {
    id = req.params.id;
    const {firstname, lastname, Address, city, car_number, lic_number, lic_date, email, password} = req.body;

    let query = `update driver set 
firstname = '${firstname}', 
lastname='${lastname}', 
Address = '${Address}', 
city='${city}',
car_number='${car_number}', 
lic_number='${lic_number}', 
lic_date='${lic_date}', 
email='${email}', 
password='${password}' where id = ${id}`;
    // query = query.replaceAll('\n', '')

    console.log(query);
    await database.query(query).then(([result, metadata]) => {
        console.log(result);
        res.status(200).send('Driver Updated Successfully');
    }).catch(err => {
        console.log(err);
        res.status(500).send('Error Occurred');
    });
});

app.get('/update', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'update.html'));
});

app.get('/update_data', async (req, res) => {
    let que = `select distinct * from driver where email = (select email from reservation where id = ${id});`
    let [result, metadata] = await database.query(que);
    let data;
    result.forEach(q => {
        console.log(q);
        data = q;
    });
    res.status(200).json(data);
});

app.get('/signup_driver', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'driverSignup.html'));
});

app.post('/signup_driver_submit', async (req, res) => {
    const {firstname, lastname, address, city, car_number, lic_number, lic_date, email, password} = req.body;
    const query = `INSERT INTO driver (firstname,lastname,address,city,car_number,lic_number,lic_date,email,password) VALUES 
    ('${firstname}','${lastname}','${address}','${city}','${car_number}','${lic_number}','${lic_date}','${email}','${password}')`;

    console.log(query);
    await database.query(query).then((result) => {
        console.log(result);
        res.status(200).send('Driver Signed Up Successfully');
    }).catch(err => {
        console.log(err);
        res.status(500).send('Error Occurred');
    });

});

app.get('/signing_driver', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'driverlogin.html'));
});

app.get('/make_reservation', async (req, res) => {
    const que = `select firstname,lastname from driver where email = '${l_email}'`
    await database.query(que).then(([ress, met]) => {
        const name = ress[0].firstname + " " + ress[0].lastname;
        res.redirect(`/make_reservation_html?username=${name}`); // redirect to the HTML file with the username as a query parameter
    });
});

app.get('/make_reservation_html', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'driverForm.html')); // send the HTML file
});

app.post('/make_reservation_sub', async (req, res) => {

    const {start, end, email, number, date, stime, Stops} = req.body;
    let reservation = `INSERT INTO reservation (start, end, email, number, date, stime) VALUES ('${start}', '${end}', '${email}', '${number}', '${date}', '${stime}')`;

    await database.query(reservation).then(async t => {
        let [results, metadata] = await database.query(`select id from reservation order by id DESC limit 1`);
        let id = results[0].id;
        const stops_QU = `INSERT INTO stops (reservation_id, stop_number, stop_location) VALUES ${Stops.map((stop, index) => `(${id}, ${index + 1}, '${stop}')`).join(', ')}`;
        await database.query(stops_QU).then(result => {
            res.status(200).send('Reservation Made Successfully');
        }).catch(err => {
            console.log(err);
            res.status(500).send('Error Occurred while making stops');
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send('Error Occurred while making rerservations');
    });
});

app.get('/view_reservation', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'view_reservation.html'));
});

app.get('/make_reservation_onload', async (req, res) => {
    console.log(l_email);
    const [respo, meta] = await database.query(`select * from reservation where email = '${l_email}'`);
    const [driverName,meto] = await database.query(`select concat(firstname,' ',lastname) as fullname from driver where email='${l_email}'`);
    console.log(driverName);
    let data = [];

    for (let i = 0; i < respo.length; i++) {
        data.push({
            res_id: respo[i].id,
            start: respo[i].start,
            end: respo[i].end,
            date: respo[i].date,
            stime: respo[i].stime,
            number: respo[i].number,
            email: respo[i].email,
            driverName: await getName(respo[i].email),
            stops: await getStops(respo[i].id)
        })
    }

    async function getName(email){
        const response = await database.query(`select concat(firstname,' ',lastname) as fullname from driver where email = '${email}'`)
        return response[0][0].fullname
    }
    async function getStops(id){
        const response = await database.query(`select stop_location from stops where reservation_id = ${id}`)

        return response[0];
    }

    console.log(data);

    res.json(data).status(200);
});

app.get('/book_ride', async (req, res) => {
     // get the username from the query parameter
    const que = `select firstName,lastName from rider where email = '${l_email}'`;
    await database.query(que).then(([ress, met]) => {
        const name = ress[0].firstName + " " + ress[0].lastName;
        res.redirect(`/book_ride_html?username=${name}`); // redirect to the HTML file with the username as a query parameter
    });
});


app.get('/book_ride_html', async (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'bookRide.html')); // send the HTML file
});

app.get('/driver/:email', async (req, res) => {
    let email = req.params.email;
    let que = `select * from driver where email = '${email}'`;
    await database.query(que).then(([ress, met]) => {
        console.log(ress);
        res.json(ress);
    });
});

app.get('/search_rides/:start/:end', async (req, res) => {
    let start = req.params.start;
    let end = req.params.end;

    let query = `SELECT * FROM reservation WHERE start = '${start}' AND end = '${end}'`;
    let [result, metadata] = await database.query(query);
    let IDs = [];
    result.forEach(e => {
        IDs.push(e.id);
    });
    let stops = [];
    for (let i = 0; i < IDs.length; i++) {
        let query = `SELECT stop_location FROM stops WHERE reservation_id = ${IDs[i]}`;
        let [result, metadata] = await database.query(query);
        stops.push(result);
    }
    let data = [];
    for (let i = 0; i < result.length; i++) {
        data.push({
            id: result[i].id,
            start: result[i].start,
            end: result[i].end,
            date: result[i].date,
            email: result[i].email,
            driverName: await fetchDriverName(result[i].email),
            stime: result[i].stime,
            number: result[i].number,
            stops: stops[i]
        });
        async function fetchDriverName(email) {
            let query = `SELECT firstName, lastName FROM driver WHERE email = '${email}'`;
            let [result, metadata] = await database.query(query);
            return result[0].firstName + ' ' + result[0].lastName;
        }
    }

    res.status(200).json(data);

});

app.delete('/delete_reservation/:res_id', async (req,res)=>{
    const id = req.params.res_id;
    try {
        await database.query(`DELETE FROM stops WHERE reservation_id = ${id}`);
        await database.query(`DELETE FROM reservation WHERE id = ${id}`);
    } catch (err) {
        console.log(err);
    }
    console.log(id);
    res.status(200).json({ message: "Deleted Successfully" });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    const cmd = `start http://localhost:${port}`
    console.log(cmd);
    // exec(cmd);
});








