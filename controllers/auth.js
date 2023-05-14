const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const async = require("hbs/lib/async");
const { promisify} = require('util');


const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER ,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE,
    port: 8889
});



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        message: 'Please provide an email and password'
      });
    }

    // Requête pour récupérer l'utilisateur avec l'email fourni
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, userRows) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
      }

      // Vérifier que l'utilisateur existe et que le mot de passe est correct
      if (!userRows.length || !(await bcrypt.compare(password, userRows[0].password))) {
        return res.status(401).render('login', {
          message: 'Email or password is incorrect'
        });
      }

      // Créer un jeton d'authentification et le stocker dans un cookie sécurisé
      const id = userRows[0].id;
      const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
      });
      console.log('the token is: ' + token);
      
      const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        httpOnly: true
      };
      res.cookie('jwt', token, cookieOptions);
      res.status(200).redirect('/');
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};




//pour le register form
exports.register = (req,res)=>{
    console.log(req.body);

// const name = req.body.name;
// const email = req.body.email;
// const password = req.body.password;
// const passwordConfirm = req.body.passwordConfirm;

//Simple
const{name,email,password,passwordConfirm} = req.body;
//connection db
db.query('SELECT email FROM users WHERE email = ?',[email],async (error,result)=>{
    if(error){
        console.log(error)
    }
    if(result.length > 0){
        return res.render('register',{
            message:'That email is already in use'
        });
    }else if(password !== passwordConfirm){
        return res.render('register',{
            message:'Password do not match'
        }); 
    }

    let hashedPassword = await bcrypt.hash(password ,8);
    console.log(hashedPassword);

    db.query('INSERT INTO users SET ?',{name: name, email:email, password:hashedPassword},(error,result)=>{
            if(error){
                console.log(error);
            }else{
                console.log(error);
                return res.render('register',{
                    message:'User registered'
                }); 
            }
    });

});
  
}

exports.isLoggedIn = async (req,res,next)=>{
    console.log(req.cookies);
    if(req.cookies.jwt){
        try {
            //1 verifier les token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET);

            console.log(decoded);
                //2 verifier si l user existe
                db.query('SELECT * FROM users WHERE id = ?',[decoded.id],(error ,result)=>{
                    console.log(result);

                    if(!result){
                        return next();
                    }
                    req.user = result[0];
                    return next();
                })
        } catch (error) {
           console.log(error);
           return next(); 
        }
    }else{
        next();
    }  
}

exports.logout = async (req,res)=>{
    res.cookie('jwt','logout',{
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });
    res.status(200).redirect('/')
}