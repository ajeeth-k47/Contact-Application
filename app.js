const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));

require('dotenv').config();

var toggle="none";
var currentuser="";

mongoose.connect(process.env.CONTACTDB_URI, { useNewUrlParser: true,useUnifiedTopology:true });

const contactSchema=new mongoose.Schema(
  {
    name:String,
    MobileNo:Number,
    EmailAddress:String
  }
);

const userContactSchema=new mongoose.Schema(
  {
    username:String,
    password:String,
    usercontacts:[
      contactSchema
    ]
  }
)

const Contact=new mongoose.model('contact',contactSchema);
const Usercontact=new mongoose.model('usercontact',userContactSchema);

app.get("/",function(req,res){
  res.render('login',{validuser:"yes"});
})

app.get("/:topic",function(req,res){
  var route=req.params.topic;

//-----------------------      Home ------------------------------------------------------------------
if(route==='home')
{
  res.render('home');
}
//-----------------------         Sign UP -------------------------------------------------------------

else if(route==="signup")
{
  res.render('signup',{toggle:toggle});
}
//-----------------------          Create or Update Contact      --------------------------------------
else if(route=="create" || route=="update")
  {


    if(route=="create")
    {
      var option={operation:'Create',placeholder1:'Enter MobileNo',placeholder2:"Enter EmailAddress"}
    }

    else
    {
      var option={operation:'Update',placeholder1:'Enter New/Old MobileNo',placeholder2:"Enter New/Old EmailAddress"}
    }

  res.render('create(OR)update',{Option:option});

  }
//-----------------------------------------------------------------------------------------------------------

//-----------------------  view contact ----------------------------------------------------------------
else if(route=="view")
{

Usercontact.findOne({username:currentuser},function(err,foundUser)
{
  var cnt=0;
  var currentcontact=foundUser.usercontacts;
  res.render('viewcontact',{contacts:currentcontact});

})

}

//-----------------------    Search  or  Delete Contact -----------------------------------------------------
  else{
      if(route=="search")
      {
        var option={  color:'btn-success',  operation:'Search',placeholder:'Search by name'}
      }

      else
      {
        var option={  color:'btn-danger',  operation:'Delete',placeholder:'Delete by name'}
      }
      res.render('search(OR)delete',{Option:option});
     }

})

//----------------------------------------------------------------------------------------------------------------

app.post("/",function(req,res){

Usercontact.findOne({username:_.toLower(req.body.username),password:_.toLower(req.body.password)},function(err,foundUser){

  if(!err){

    if(!foundUser){
      res.render('login',{validuser:"no"});
    }

    else{
      currentuser=_.toLower(req.body.username);
      res.redirect("/home");
    }

  }

})

})



app.post("/:topic",function(req,res)
{
  var route=req.params.topic;

  if(route==='signup')
  {

    if(req.body.password===req.body.confirmpassword){

      Usercontact.findOne({username:req.body.username},function(err,foundUser){

        if(!err){

            if(!foundUser){

              toggle="none";
              var newuser=new Usercontact({
                username:_.toLower(req.body.username),
                password:_.toLower(req.body.password),
                usercontacts:[]
              })
              newuser.save();
              res.redirect('/');

            }

            else{
             toggle="exist";
              res.redirect('/signup');
            }
        }

      })
    }

    else{
      toggle="mismatch";
      res.redirect('/signup');
      console.log(users);
    }

  }

  else if(route=="Create"){

var contact= new Contact({
  name:_.capitalize(req.body.contactName),
  MobileNo:req.body.mobileNo,
  EmailAddress:req.body.email
});



//        creating contact records----------------------------------------------



Usercontact.findOne({username:currentuser},function(err,foundUser){

  if((foundUser.usercontacts).length==0){

  foundUser.usercontacts.push(contact);
  foundUser.save();
  res.render('generic',{content:"Contact has been Created Successfully!!!"});

  }

  else{

  var cnt=0;
  var currentcontact=foundUser.usercontacts;
  for(var i=0;i<currentcontact.length;i++){

    if(currentcontact[i].name==_.capitalize(req.body.contactName) || currentcontact[i].MobileNo==req.body.mobileNo)
    {
      cnt++;

          res.render('generic',{content:"Name / Mobileno already exists!!!"});
    }

  }

  if(cnt==0)
  {
      currentcontact.push(contact);
      foundUser.save();
      res.render('generic',{content:"Contact has been Created Successfully!!!"});
  }

  }

})



}

///-------------------- Search Contacts ----------------------------------------




  else if (route=="Search")
    {

     Usercontact.findOne({username:currentuser},function(err,foundUser)
     {
       var cnt=0;
       var currentcontact=foundUser.usercontacts;
       for(var i=0;i<currentcontact.length;i++){

         if(currentcontact[i].name==_.capitalize(req.body.name))
         {
           cnt++;
           res.render('results',{detail:currentcontact[i]});
         }

       }

       if(cnt==0)
       {
           res.render('generic',{content:"Oop's! No matches found😟"});

       }

     })

   }

//---------------------- Update contacts ---------------------------------------



  else if (route=="Update") {


         Usercontact.findOne({username:currentuser},function(err,foundUser)
         {
           var cnt=0;
           var currentcontact=foundUser.usercontacts;
           for(var i=0;i<currentcontact.length;i++){

             if(currentcontact[i].name==_.capitalize(req.body.contactName))
             {
               cnt++;
         Usercontact.updateOne({username:currentuser,"usercontacts.name":_.capitalize(req.body.contactName)},{'$set':{"usercontacts.$.MobileNo":req.body.mobileNo , "usercontacts.$.EmailAddress":req.body.email}},function(err)
           {
             if(err)
             {
                 res.render('generic',{content:"Error:Oop's! No matches found😟"});
             }

             else
             {
                 res.render('generic',{content:"Updated Contact Successfully!!!"});
             }

           })

         }
       }
         if(cnt==0)
         {
             res.render('generic',{content:"Oop's! No matches found😟"});

         }
       })

  }

//--------------------- Delete contacts ----------------------------------------



  else
    {
      Usercontact.findOne({username:currentuser},function(err,foundUser)
      {
        var cnt=0;
        var currentcontact=foundUser.usercontacts;
        for(var i=0;i<currentcontact.length;i++){

          if(currentcontact[i].name==_.capitalize(req.body.name))
          {
            cnt++;
            Usercontact.updateOne({username:currentuser},{"$pull":{"usercontacts":{"name":_.capitalize(req.body.name)}}},{safe:true,multi:true},function(err)
            {

              if(err)
              {
                  res.render('generic',{content:"Error:Oop's! No matches found😟"});
              }

              else
              {
                res.render('generic',{content:"Contact has been deleted Successfully!!!"});
              }

            })
          }

        }


        if(cnt==0)
        {
            res.render('generic',{content:"Oop's! No matches found😟"});

        }

      })

    }


})



//---------------------PORT--------------------------------------

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("Server is Successfully running on port 3000");
})
