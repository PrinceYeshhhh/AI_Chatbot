import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export const ApiDocs: React.FC = () => {
  return <SwaggerUI url="/openapi.json" />;
}; 