const express = require('express')
const mysql = require('mysql2')
const multer = require('multer')//file storing to the Server , like in order to acceess and store the info to the server
const bodyParser = require('body-parser') 
const app = express()
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const session = require('express-session')
const crypto = require('crypto')    

app.use(session ({
    secret: crypto.randomBytes(64).toString('hex'),
    resave : false,
    saveUninitialized : false
}))



app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.static(path.join(__dirname, 'public'))) 
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

const connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "melvin123",
    database: " User",
    connectionLimit: 10
})
app.get('/update2', (req, res)=> {
    res.render('Secondupt.ejs')
})




//from requiring, to configuring the Secccions, to ooThe Connecting to the database


app.get('/', (req, res) => {
    res.render('signup.ejs')
}) 
app.get('/login', (req, res) => {
    res.render('login.ejs')
})
app.get('/update', (req, res) => {
    res.render('update.ejs')
})
app.get('/delete', (req, res) => {
   const data = req.session.email
   connection.getConnection((error, connection) => {
    if(error){
        res.send("Error connecting to the database")
      
    }
    const query = `UPDATE MemberInfo SET image = NULL WHERE email = ?`
    connection.query(query, [data], (err, result) => {
        if(err) {
            res.send("Error in removing  your image")
        } 
        const query2 = `SELECT username, info, email FROM MemberInfo WHERE email = ?`
        connection.query(query2, [data], (err, result) => {
            if(err) throw err;
            const user = result[0]
            res.render('delete.ejs', { user : user})///Ask Abt here
        })
    })
   })
})

//=-----------------------------------This is the Configuration of the Storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/uploads/');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload =  multer({ storage : storage}) //Is this for the local stuf

//Uploading A photo, Meaning we want to Create  a new user in the database Making him to have 
//a Profile picture (and the Names, and the, and the email) 




///This is the 1st landing page

app.post('/signup', upload.single('image'), (req, res) => {//The image name is the name of the inout field of the file in The sign up EJS
    connection.getConnection((error, connection) => {
        if (error) {//?hOW to upload in case we need to piut many Images 
            return res.status(500).json({ error: "Error connecting to the database"})
        }

        const uname = req.body.uname
        const email= req.body.email
        const password = req.body.password
        const cpass = req.body.cpass
        const info = req.body.message  //Chck  how this is created in Mongo like in The form of lINK
        const gender = req.body.gender
        const image = fs.readFileSync(req.file.path)
        const query = `INSERT INTO MemberInfo (username, email, password ,cpassword, image,info, gender) VALUES (?,?,?,?,?,?,?)`
        connection.query(query, [uname, email, password, cpass, image, info, gender], (error) => {
            connection.release()
            if (error) throw error;
            fs.unlinkSync(req.file.path)
            res.redirect('/login')
           
        })
        // 
    })
})

////////////////////////////////////////////////////////////////////////This is for the login Information



app.POST('/profile', (req, res) => {
      // connection.query('SELECT email FROM users WHERE email = ?', [email], (error, results) => {
        //     if (error) {
        //         return res.send('Error retrieving email from the database');
        //     }
        
        //     if (results.length === 0) {
        //         return res.send('Email not found in the database');
        //     }
        
        //     const email = results[0].email;
        //     // Use the retrieved email here
        // });
        
    req.session.email =  req.body.email
    console.log("User data stored in the session")
    const email = req.body.email
    const password = req.query.password
    

    ///We create a coonection for  Retreiving the information     
    connection.getConnection((error, connection) => {
        if (error) {
            return res.status(500).json({ error: "Error connecting to the database"})
        }
        const query = `SELECT * FROM MemberInfo WHERE email = ? AND password = ?`
        connection.query(query, [email, password], (error, result) => {
            connection.release()
            if(error){
                return res.status(500).send({ error: "Error retrieving the data from the database"})
            }
            const user = result[0]//
            if(user){
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});g
            } else {
                res.send('Incorrect username or password')
            }
        })
    })                                    
})

//-----------------------------------------------------------------------------------------



////////Updating from  all User info 



const update = multer({ dest : 'uploads/'})
app.post('/update',update.single('image'),(req, res) => {
    const data = req.session.email
    console.log(data)
    const username = req.body.uname
    const password = req.body.password
    const message = req.body.message
    let image;
    if(req.file && req.file.path){
        image = fs.readFileSync(req.file.path)
    }else {
        res.send('No file was uploaded')
    }
    connection.getConnection((error, connection) => {
        if (error) {
            res.send("Error connecting to the database")
        }
        const query = `UPDATE MemberInfo SET username = ? , password = ? , info = ? , image = ? WHERE email = ? `
        connection.query(query, [username, password, message, image, data], (error, result) => {
            if(error) {
                res.send("Error in updating your information")
            }
            fs.unlinkSync(req.file.path)


          const query1 = `SELECT * FROM MemberInfo WHERE email = ?`
          connection.query(query1, [data], (err, result) => {
            if(err) {
                res.send("Error in updating your information")
            }
            const user = result[0]
            if(user){
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});
            } else {
                res.send('Incorrect username or password')
            }
          })
        })
    })
})

app.post('/update2',update.single('image'),(req, res) => {
    const data = req.session.email
    const image = fs.readFileSync(req.file.path)

    connection.getConnection((error, connection) => {
        if(error){
            res.send("Error connecting to the database")
        }
        const query =  `UPDATE MemberInfo SET image = ? WHERE email = ?`
        connection.query(query, [image, data], (err)=> {
            if(err){
                res.send("Error retrieving the data from the database")
            }


            const query3 = `SELECT * FROM MemberInfo WHERE email = ?`
            connection.query(query3, [data], (err, result) => {
                if (err) throw err;
                fs.unlinkSync(req.file.path)
                const user = result[0]
                const base64Image = Buffer.from(user.image, 'binary').toString('base64');
                res.render('profile.ejs', { user: user, image: base64Image});
                
            })
        })
    })
})


app.listen(3000)


