import { pageBehindReadingModal, redirectBehindReadingModal } from './readingModalUtils';

describe('pageBehindReadingModal', () => {
  it("goes back to Home from a modal over Home's history", () => {
    expect(pageBehindReadingModal('/home/readings/14/send', '14')).toBe('/home');
  });

  it("goes back to the reading's page from a modal over it", () => {
    expect(pageBehindReadingModal('/readings/14/cost-and-bill', '14')).toBe('/readings/14');
  });
});

describe('redirectBehindReadingModal', () => {
  it("keeps Home's filters and pages on the way back", () => {
    expect(redirectBehindReadingModal('http://localhost/readings/14/send?status=sent&pages=2', 14)).toBe(
      '/readings/14?status=sent&pages=2',
    );
  });
});
