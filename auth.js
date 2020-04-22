const authorize = (path, status) =>{
    return ((req, res, next) => {
        if(req.session.email != ''){
            next()
        }else{
            return res.redirect(path)      
        }
    })
}
 
module.exports = { authorize }