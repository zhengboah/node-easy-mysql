# node-easy-mysql



## Installation
```
npm install node-easy-mysql
```

## Usage
```
const Db = require('node-easy-mysql')
const co = require('co')

const dbInstance = new Db({
  host:   'localhost', 
  user:   'root',
  password: 'root',
  database: 'mydb'
})
<<<<<<< 4fff394cd6b674d8a71ffc93e577f3f4f91b5bee

## API
* [select](#select)
* insert
* update
* delete
* sum
* count
* 
=======
>>>>>>> readme
co(function * () {
  let result = yield dbInstance.table('account').field(['a.email', ['b.org_id', 'dddd']]).alias('a').join('left join zy_account_group b on a.group_id=b.id').limit(1).select()
  console.log(result)
}).catch((err) => {
  console.log(err)
})
```

## API
* [select](#select)
* [insert](#insert)
* [update](#update)
* [delete](#delete)
* [sum](#sum)
* [count](#count)
* [avg](#avg)
* [max](#max)
* [min](#min)

<a name="select"/>

### select
```  
  yield dbInstance.table('account').field(['a.email', ['b.org_id', 'dddd']]).alias('a').join('left join zy_account_group b on a.group_id=b.id').limit(1).select()
```

<a name="insert"/>

### insert
```insert

 yield dbInstance.table('account').insert({
    email: 'test@111.com',
    password: '8*********sdfsdfsd',
    name: '"test"',
    tel: 333333333,
  })
```
<a name="update"/>

### update
``` update
  yield dbInstance.table('account').where({account: 'ttteeet@jjjj3.com', status: 2}).update({name: 'dddddd', group_id: 33, permission: 111})
```

<a name="delete">

### delete
```
  yield dbInstance.table('account').where({account: 'test@111.com'}).delete()
<<<<<<< 4fff394cd6b674d8a71ffc93e577f3f4f91b5bee
  <a name="select"/>
  yield dbInstance.table('account').field(['a.email', ['b.org_id', 'dddd']]).alias('a').join('left join zy_account_group b on a.group_id=b.id').limit(1).select()
=======
```  

>>>>>>> readme


<a name="find"/>

### find
```
  yield dbInstance.table('account').where({permission: 111}).find()
```
<a name="sum"/>

### sum
```
  result = yield dbInstance.table('account').where({pwd: '222222'}).sum('id')
```
<a name="min"/>

### min
```  
  result = yield dbInstance.table('account').where({pwd: '222222'}).min('id')
```  
<a name="max"/>

### max
```  
  result = yield dbInstance.table('account').where({pwd: '222222'}).max('id')
``` 

<a name="avg"/>

### avg
```  
  result = yield dbInstance.table('account').where({pwd: '222222'}).avg('id')
``` 

<a name="count"/>

### count
```  
  result = yield dbInstance.table('account').where({pwd: '222222'}).count('id')
```
<a name="transaction"/>

### transaction
```
  yield dbInstance.startTrans()
  yield dbInstance.table('account1').add({account:'33333', pwd: '22222222222'})
  yield dbInstance.table('account1').select()
  yield dbInstance.commit()
```