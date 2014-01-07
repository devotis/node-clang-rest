##node-clang-rest

Node based JSON/HTTP proxy to the Clang's SOAP webservice API.

This is a restful webservice that proxies HTTP/GET requests to Clang's SOAP API, passing along any parameters in the query string. Returns SOAP responses as JSON.

##Demo version here

https://node.leadstoloyals.com

##Authentication

Authentication to the Clang Webservice API is done by using a token. Contact the Support Desk of your Clang reseller to obtain a token. A token is a uuid that has to be supplied through either HTTP header uuid or query parameter _uuid

##Resources

###customers

Example operations
- GET /clang/customers
- GET /clang/customers/39515
- PUT /clang/customers/39515?firstname=Christiaan
- POST /clang/customers?firstname=test&emailAddress=a@b.nl
- DELETE /clang/customers/39515

HTTP verb can be overriden using _method query parameter
- GET /clang/customers/39515?_method=PUT&firstname=Christiaan
- GET /clang/customers?_method=POST&firstname=test&emailAddress=a@b.nl
- GET /clang/customers/39515_method=DELETE
- 
(read more about [RESTful conventions](http://microformats.org/wiki/rest/urls))

###emails

- GET /clang/emails/26597
- GET /clang/emails/26597/sendToCustomer?customerId=328191

##Security

All requests are proxied to Clang using HTTPS. The supplied uuid is passed along with it without alteration.
