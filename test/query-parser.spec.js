'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
chai.should();

const qParser = require('../src/query-parser');

describe('query parser', () => {
  it('should parse single queries', done => {
    const results = qParser("tag:query");
    results.length.should.equal(1);
    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`tag`);
    results[0].query.should.equal(`query`);
    done();
  });

  it('should parse multiple queries', done => {
    const results = qParser("a:b c:d e:f");
    results.length.should.equal(5);
    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`a`);
    results[0].query.should.equal(`b`);
    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`c`);
    results[1].query.should.equal(`d`);
    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`and`);
    results[3].type.should.equal(`term`);
    results[3].tag.should.equal(`e`);
    results[3].query.should.equal(`f`);
    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`and`);
    done();
  });

  it('should parse quoted strings, but remove the quotes', done => {
    const results = qParser(`tag:"quoted query"`);
    results.length.should.equal(1);
    results[0].tag.should.equal(`tag`);
    results[0].query.should.equal(`quoted query`);
    done();
  });

  it('should allow non-word characters', done => {
    const results = qParser(`pow:<4 tou:>9`);
    results.length.should.equal(3);
    results[0].tag.should.equal(`pow`);
    results[0].query.should.equal(`<4`);
    results[1].tag.should.equal(`tou`);
    results[1].query.should.equal(`>9`);
    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`and`);
    done();
  });

  it('should parse multiple quoted strings', done => {
    const results = qParser(`tag1:"quoted query" tag2:"another great one"`);
    results.length.should.equal(3);
    results[0].tag.should.equal(`tag1`);
    results[0].query.should.equal(`quoted query`);
    results[1].tag.should.equal(`tag2`);
    results[1].query.should.equal(`another great one`);
    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`and`);
    done();
  });

  it('should allow colons inside of quoted strings', done => {
    const results = qParser(`tag:"ahoy: there"`);
    results.length.should.equal(1);
    results[0].tag.should.equal(`tag`);
    results[0].query.should.equal(`ahoy: there`);
    done();
  });

  it('should allow colons inside of multiple quoted strings', done => {
    const results = qParser(`a:"magic: the gathering" b:nothing c:"come on, what's the deal?"`);
    results.length.should.equal(5);
    results[0].tag.should.equal(`a`);
    results[0].query.should.equal(`magic: the gathering`);
    results[1].tag.should.equal(`b`);
    results[1].query.should.equal(`nothing`);
    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`and`);
    results[3].tag.should.equal(`c`);
    results[3].query.should.equal(`come on, what's the deal?`);
    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`and`);
    done();
  });

  it('should allow space after colon', done => {
    const results = qParser(`a: b`);
    results.length.should.equal(1);
    results[0].tag.should.equal(`a`);
    results[0].query.should.equal(`b`);
    done();
  });

  it('should return zero results for incomplete tag:query', done => {
    const results = qParser(`tag`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for invalid double quotes', done => {
    const results = qParser(`tag::query`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for quote before colon', done => {
    const results = qParser(`tag":query`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for unclosed quotes', done => {
    const results = qParser(`tag:"query`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for invalid double tags', done => {
    const results = qParser(`a b:query`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for quote before tag', done => {
    const results = qParser(`"a:b`);
    results.length.should.equal(0);
    done();
  });

  it('should return zero results for colon before tag', done => {
    const results = qParser(`:a:b`);
    results.length.should.equal(0);
    done();
  });

  it ('should parse "or" between terms using postfix', done => {
    const results = qParser(`a:b or c:d`);
    results.length.should.equal(3);
    results[0].tag.should.equal(`a`);
    results[0].query.should.equal(`b`);
    results[1].tag.should.equal(`c`);
    results[1].query.should.equal(`d`);
    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`or`);
    done();
  });

  it ('should treat "or" after colon as a query', done => {
    const results = qParser(`a:or`);
    results.length.should.equal(1);
    results[0].tag.should.equal(`a`);
    results[0].query.should.equal(`or`);
    done();
  });

  it ('should treat colon after "or" as an error', done => {
    const results = qParser(`or:b`);
    results.length.should.equal(1);
    results[0].type.should.equal(`operator`);
    results[0].operator.should.equal(`or`);
    done();
  });

  it ('should treat "or" in quoted queries as text', done => {
    const results = qParser(`name:"Fact or Fiction"`);
    results.length.should.equal(1);
    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`name`);
    results[0].query.should.equal(`Fact or Fiction`);
    done();
  });

  it ('should process multiple "not" in a row', done => {
    const results = qParser(`t:goblin not t:legendary not t:artifact`);
    results.length.should.equal(7);
    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`t`);
    results[0].query.should.equal(`goblin`);

    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`t`);
    results[1].query.should.equal(`legendary`);

    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`not`);

    results[3].type.should.equal(`operator`);
    results[3].operator.should.equal(`and`);

    results[4].type.should.equal(`term`);
    results[4].tag.should.equal(`t`);
    results[4].query.should.equal(`artifact`);

    results[5].type.should.equal(`operator`);
    results[5].operator.should.equal(`not`);


    results[6].type.should.equal(`operator`);
    results[6].operator.should.equal(`and`);

    done();
  });

  it ('should handle early "or"', done => {
    const results = qParser(`t:a or t:b t:c t:d`);
    results.length.should.equal(7);

    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`t`);
    results[0].query.should.equal(`a`);

    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`t`);
    results[1].query.should.equal(`b`);

    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`or`);

    results[3].type.should.equal(`term`);
    results[3].tag.should.equal(`t`);
    results[3].query.should.equal(`c`);

    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`and`);

    results[5].type.should.equal(`term`);
    results[5].tag.should.equal(`t`);
    results[5].query.should.equal(`d`);

    results[6].type.should.equal(`operator`);
    results[6].operator.should.equal(`and`);

    done();
  });

  it (`should parse parentheses that don't change order`, done => {
    const results = qParser(`( t:a or t:b ) and t:c`);
    results.length.should.equal(5);

    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`t`);
    results[0].query.should.equal(`a`);

    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`t`);
    results[1].query.should.equal(`b`);

    results[2].type.should.equal(`operator`);
    results[2].operator.should.equal(`or`);

    results[3].type.should.equal(`term`);
    results[3].tag.should.equal(`t`);
    results[3].query.should.equal(`c`);

    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`and`);

    done();
  });

  it (`should parse parentheses that do change the order`, done => {
    const results = qParser(`t:a or ( t:b and t:c )`);
    results.length.should.equal(5);

    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`t`);
    results[0].query.should.equal(`a`);

    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`t`);
    results[1].query.should.equal(`b`);

    results[2].type.should.equal(`term`);
    results[2].tag.should.equal(`t`);
    results[2].query.should.equal(`c`);

    results[3].type.should.equal(`operator`);
    results[3].operator.should.equal(`and`);

    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`or`);
    done();
  });


  it (`should parse parentheses that are right next to the term`, done => {
    const results = qParser(`t:a or (t:b and t:c)`);
    results.length.should.equal(5);

    results[0].type.should.equal(`term`);
    results[0].tag.should.equal(`t`);
    results[0].query.should.equal(`a`);

    results[1].type.should.equal(`term`);
    results[1].tag.should.equal(`t`);
    results[1].query.should.equal(`b`);

    results[2].type.should.equal(`term`);
    results[2].tag.should.equal(`t`);
    results[2].query.should.equal(`c`);

    results[3].type.should.equal(`operator`);
    results[3].operator.should.equal(`and`);

    results[4].type.should.equal(`operator`);
    results[4].operator.should.equal(`or`);
    done();
  });

  it (`should throw with mismatched parentheses`, done => {
    try {
      qParser(`t:a or t:b and t:c)`);
      chai.fail();
    } catch (e) {
      e.message.should.equal(`Missing an opening parentheses`);
      done();
    }

  });
});