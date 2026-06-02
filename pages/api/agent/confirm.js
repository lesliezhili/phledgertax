export default(req,res)=>{res.json({success:!!req.body?.confirmed,msg:req.body?.confirmed?'Done':'Cancelled'});}
