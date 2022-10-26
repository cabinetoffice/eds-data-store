"use strict";
const AmplifyBackend = require('aws-sdk/clients/amplifybackend');
exports.handler = async (event, context) => {
    try {
        const amplifyBackendService = new AmplifyBackendService(event);
        await amplifyBackendService.validateToken();
        console.log(`verified challenge code with result: ${event.response.answerCorrect}`);
        context.done(null, event);
        return event;
    }
    catch (e) {
        console.error('exception occured during verify', e);
        event.response.answerCorrect = false;
        context.done(e, event);
    }
};
class AmplifyBackendService {
    constructor(event) {
        const { sessionId, appId } = event.request.clientMetadata;
        const { challengeAnswer } = event.request;
        this.appId = appId;
        this.sessionId = sessionId;
        this.challengeAnswer = challengeAnswer;
        this.event = event;
    }
    async validateToken() {
        this.amplifyBackend = this.initService();
        // 1. Get token
        const tokenResponse = await this.getToken();
        // 2. Validate token
        const challengeCode = tokenResponse.ChallengeCode;
        if (challengeCode && this.challengeAnswer && this.challengeAnswer === challengeCode) {
            this.event.response.answerCorrect = true;
        }
        else {
            this.event.response.answerCorrect = false;
        }
        // 3. Delete token
        await this.deleteToken();
        return this.event.response.answerCorrect;
    }
    initService() {
        const amplifyBackend = process.env.ENDPOINT
            ? new AmplifyBackend({
                endpoint: process.env.ENDPOINT,
            })
            : new AmplifyBackend();
        return amplifyBackend;
    }
    getToken() {
        return this.amplifyBackend
            .getToken({
            AppId: this.appId,
            SessionId: this.sessionId,
        })
            .promise();
    }
    deleteToken() {
        return this.amplifyBackend
            .deleteToken({
            AppId: this.appId,
            SessionId: this.sessionId,
        })
            .promise();
    }
}
exports.AmplifyBackendService = AmplifyBackendService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvcGFja2FnZWRfanMvY29nbml0b190cmlnZ2Vyc19hcnRpZmFjdHMvYW1wbGlmeS1sb2dpbi12ZXJpZnktYXV0aC1jaGFsbGVuZ2UvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBRWpFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUN6QyxJQUFJO1FBQ0YsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9ELE1BQU0scUJBQXFCLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3Q0FBd0MsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hCO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsTUFBTSxxQkFBcUI7SUFDekIsWUFBWSxLQUFLO1FBQ2YsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUMxRCxNQUFNLEVBQUUsZUFBZSxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUMxQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUN2QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWE7UUFDakIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDekMsZUFBZTtRQUNmLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRTVDLG9CQUFvQjtRQUNwQixNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQ2xELElBQUksYUFBYSxJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxhQUFhLEVBQUU7WUFDbkYsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUMxQzthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztTQUMzQztRQUVELGtCQUFrQjtRQUNsQixNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUV6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQztJQUMzQyxDQUFDO0lBRUQsV0FBVztRQUNULE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUTtZQUN6QyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVE7YUFDL0IsQ0FBQztZQUNKLENBQUMsQ0FBQyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sY0FBYyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsY0FBYzthQUN2QixRQUFRLENBQUM7WUFDUixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzFCLENBQUM7YUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNmLENBQUM7SUFFRCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsY0FBYzthQUN2QixXQUFXLENBQUM7WUFDWCxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzFCLENBQUM7YUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNmLENBQUM7Q0FDRjtBQUVELE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyJ9