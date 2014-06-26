exports.errors = {
  //start generic error codes
  '40101': 'Invalid api key or non provided.',
  '40102': 'uuid missing or invalid (add _uuid=... to your url)',
  '40401': 'Resource not found.',
  '50901': 'Invalid content-type {content-type}, must be {required-content-type}',
  '50902': 'Unknown fields: {fields}',
  '50903': 'A JSON object is required in the request body with these properties: {properties}.',
  '50904': 'All of these variables must be set to a value in the query string: {variables}.',
  '50905': 'Any of these variables must be set to a value in the query string: {variables}.',

  '50001': 'Clang api not created yet. Try again in a few seconds.',
  '50002': 'Clang resource not specified',
  '50003': 'Resource {resource} actually not available',
  '50004': 'Custom action invoked on unspecified resource (use /objects/123/customaction)',
  '50005': 'HTTP verb for this resource is not allowed',
  '50006': 'Method for this resource is not allowed'

};