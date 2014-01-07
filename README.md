node-clang-rest
===============

RESTifies the Clang SOAP API

HTTP verb can be overridden using _method query parameter.

uuid has to be supplied through either HTTP header or query parameter _uuid

Example urls:
- /api/clang/customers
- /api/clang/customers/39515
- /api/clang/customers/39515?_method=PUT&firstname=Christiaan
- /api/clang/customers?_method=POST&firstname=test&emailAddress=a@b.nl
- /api/clang/customers/39515?_method=DELETE
