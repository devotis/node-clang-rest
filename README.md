# node-clang-rest

Node based JSON/HTTP proxy to the Clang's SOAP webservice API.

This is a restful webservice that proxies HTTP requests to Clang's SOAP API, passing along any parameters in the query string. All requests are proxied to Clang using HTTPS. Returns SOAP responses as JSON.

## Token

Authentication to the Clang Webservice API is done using a token (uuid). Contact the Support Desk of your Clang reseller to obtain a token. [Contact Leads to Loyals](https://www.leadstoloyals.nl/en/contact/) if you'd like to learn more about using Clang and this API.

Pass the token as an `uuid` header or a `_uuid` query parameter. The supplied token will be proxied to Clang with each request.

## Usage

- `GET /customers`
- `GET /customers/39515`
- `PUT /customers/39515`
  ```
  {
    "firstname": "Christiaan"
  }
  ```
- `POST /customers`
  ```
  {
    "firstname": "test",
    "emailAddress": "a@b.nl"
  }
  ```
- `DELETE /customers/39515`

The HTTP verb can be overriden using `_method` query parameter and you may send the parameters in the url as well.
- `GET /customers/39515?_method=PUT&firstname=Christiaan`
- `GET /customers?_method=POST&firstname=test&emailAddress=a@b.nl`
- `GET /customers/39515_method=DELETE`

(read more about [RESTful conventions](http://microformats.org/wiki/rest/urls))

- `GET /emails/26597`
- `POST /emails/26597/sendToCustomer`
  ```
  {
    "customerId": 328191
  }
  ```

The last example is a custom action on a single resource. That is only allowed using POST.

## Representation

Expect an array of objects when 200/201 or an object with a message property when an error occurred.

HTTP statusses as you would expect from a RESTful webservice remain intact.
