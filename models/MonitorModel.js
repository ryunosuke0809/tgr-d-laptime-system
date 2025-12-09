
console.log('START MONITOR  MODULE');

module.exports = {
  getLayoutList: function () {
      return new Promise ((resolve, reject) => {
          connection.getConnection(function(err, conn){
              conn.query(sql.LayoutList,  (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
  
//---- 7/8 add shidara ----
  getUserLayoutList: function () {
      return new Promise ((resolve, reject) => {
          connection.getConnection(function(err, conn){
              conn.query(sql.UserLayoutList,  (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
//-------------------------  
  
  getItemList: function (layoutid) {
      return new Promise ((resolve, reject) => {
          var para = [];
          para.push(layoutid);
          //para.push(layouttype);
          connection.getConnection(function(err, conn){
              conn.query( sql.ItemList, para, (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
  
  getItemList2: function (layoutid) {
      return new Promise ((resolve, reject) => {
          var para = [];
          para.push(layoutid);
          //para.push(layouttype);
          connection.getConnection(function(err, conn){
              conn.query( sql.ItemList2, para, (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
  getLayoutHeader: function (layoutid) {
      return new Promise ((resolve, reject) => {
          var para = [];
          para.push(layoutid);
          connection.getConnection(function(err, conn){
              conn.query( sql.LayoutHeader, para, (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
  getLayoutLists: function () {
      return new Promise ((resolve, reject) => {
          connection.getConnection(function(err, conn){
              conn.query( sql.LayoutList, (err, result, fields) => {
                  conn.release();
                  if ( err ) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          });
      });
  },
}
