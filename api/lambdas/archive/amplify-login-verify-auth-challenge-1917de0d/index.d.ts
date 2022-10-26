export function handler(event: any, context: any): Promise<any>;
export class AmplifyBackendService {
    constructor(event: any);
    appId: any;
    sessionId: any;
    challengeAnswer: any;
    event: any;
    validateToken(): Promise<any>;
    amplifyBackend: AmplifyBackend | undefined;
    initService(): AmplifyBackend;
    getToken(): Promise<import("aws-sdk/lib/request").PromiseResult<AmplifyBackend.GetTokenResponse, AWS.AWSError>>;
    deleteToken(): Promise<import("aws-sdk/lib/request").PromiseResult<AmplifyBackend.DeleteTokenResponse, AWS.AWSError>>;
}
import AmplifyBackend = require("aws-sdk/clients/amplifybackend");
//# sourceMappingURL=index.d.ts.map