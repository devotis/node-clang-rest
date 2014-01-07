##node-clang-rest

Node based JSON/HTTP proxy to the Clang's SOAP webservice API.

This is a restful webservice that proxies HTTP requests to Clang's SOAP API, passing along any parameters in the query string. All requests are proxied to Clang using HTTPS. Returns SOAP responses as JSON.

##Demo version here

https://node.leadstoloyals.com

##Authentication

Authentication to the Clang Webservice API is done using a token (uuid). Contact the Support Desk of your Clang reseller to obtain a token. [Contact Leads to Loyals](http://www.leadstoloyals.nl/en/contact.html) if you'd like to learn more about using Clang and this API.

##Resources

The first request to any resource will result in a 401 to indicate the uuid is missing. Then you can add _uuid to the query parameters. It will be kept in your session. Session is maintained using a cookie. The supplied uuid will be proxied to Clang with each request.

The next request (with uuid) may result in a 503 error ('Clang api not created yet. Try again in a few seconds.'). Just try again in a few seconds.

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

(read more about [RESTful conventions](http://microformats.org/wiki/rest/urls))

###emails

- GET /clang/emails/26597
- POST /clang/emails/26597/sendToCustomer?customerId=328191

The last example is a custom action on a single resource. That is only allowed using POST.

###Errors

Errors are reported in JSON format

    {
      error: 'Clang api not created yet. Try again in a few seconds.'
    }
