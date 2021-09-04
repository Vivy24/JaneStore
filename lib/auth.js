exports.isAdmin=(req,res,done)=>{
    if(req.isAuthenticated()){
        done();
    }
    else{
        res.render('login',{message:"Please log in to get access to this information"});
    }  
}