import { WWTHackathon2016FrontendPage } from './app.po';

describe('wwt-hackathon-2016-frontend App', function() {
  let page: WWTHackathon2016FrontendPage;

  beforeEach(() => {
    page = new WWTHackathon2016FrontendPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
