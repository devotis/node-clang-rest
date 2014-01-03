node-clang-rest
===============

RESTifies the Clang SOAP API

HTTP verb can be overridden using _method query parameter.

uuid has to be supplied through either HTTP header or query parameter _uuid

Example routes:
/api/clang/customer
/api/clang/customer/39515
/api/clang/customer/39515?_method=PUT&firstname=Christiaan
/api/clang/customer?_method=POST&firstname=test&emailAddress=a@b.nl
/api/clang/customer/39515?_method=DELETE
