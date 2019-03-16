if(process.env.NODE_ENV === 'production'){
    module.exports = {mongoURI: 'mongodb://jordan:jordan1@ds059215.mlab.com:59215/gameapp'}
}
else{
    module.exports = {mongoURI:'mongodb://localhost:27017/multiplayergamedata'}
}