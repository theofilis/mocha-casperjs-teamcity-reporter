processPID = "web";
if (typeof process == 'undefined') {

} else {
	processPID = process.pid.toString();
}

var TEST_IGNORED = "##teamcity[testIgnored name='%s' message='%s' flowId='%s']";
var SUITE_START = "##teamcity[testSuiteStarted name='%s' flowId='%s']";
var SUITE_END = "##teamcity[testSuiteFinished name='%s' duration='%s' flowId='%s']";
var TEST_START = "##teamcity[testStarted name='%s' captureStandardOutput='true' flowId='%s']";
var TEST_FAILED = "##teamcity[testFailed name='%s' message='%s' details='%s' captureStandardOutput='true' flowId='%s']";
var TEST_END = "##teamcity[testFinished name='%s' duration='%s' flowId='%s']";
var Base, log;

if (typeof window == 'undefined') {
	// running in Node
	Base = require('mocha').reporters.Base;
	log = console.log;
} else {
	Base = window.Mocha.reporters.Base;
	log = console.log;
}

function escape(str) {
	if (!str) {
		return '';
	}
	return str
		.toString()
		.replace(/\x1B.*?m/g, '') // eslint-disable-line no-control-regex
		.replace(/\|/g, '||')
		.replace(/\n/g, '|n')
		.replace(/\r/g, '|r')
		.replace(/\[/g, '|[')
		.replace(/\]/g, '|]')
		.replace(/\u0085/g, '|x')
		.replace(/\u2028/g, '|l')
		.replace(/\u2029/g, '|p')
		.replace(/'/g, '|\'');
}

function format(args) {
	var argc = args.length,
		v = (argc ? args[0] + '' : '').split('%s'),
		i = 1,
		len = v.length,
		r = v[0];

	if (argc > len) {
		argc = len;
	}
	while (i < argc) {
		r += args[i] + v[i++];
	}
	while (i < len) {
		r += '%s' + v[i++];
	}
	return r;
}

function formatString() {
	var formattedArguments = [];
	var args = Array.prototype.slice.call(arguments, 0);
	// Format all arguments for TC display (it escapes using the pipe char).
	var tcMessage = args.shift();
	args.forEach(function (param) {
		formattedArguments.push(escape(param));
	});
	formattedArguments.unshift(tcMessage);
	return format(formattedArguments);
}

/**
 * Initialize a new "Teamcity" reporter.
 *
 * @param {Runner} runner
 * @param {options} options
 * @api public
 */

function Teamcity(runner, options) {
	if (typeof process == 'undefined') {
		var process = {
			env: {
				MOCHA_TEAMCITY_FLOWID: "web",
				MOCHA_TEAMCITY_TOP_LEVEL_SUITE: "web"
			}
		};
	} else {

	}

	var reporterOptions = options.reporterOptions || {};
	var flowId;
	(reporterOptions.flowId) ? flowId = reporterOptions.flowId: flowId = process.env['MOCHA_TEAMCITY_FLOWID'] || processPID;
	Base.call(this, runner);
	var stats = this.stats;
	var topLevelSuite = reporterOptions.topLevelSuite || process.env['MOCHA_TEAMCITY_TOP_LEVEL_SUITE'];

	runner.on('suite', function (suite) {
		if (suite.root) {
			if (topLevelSuite) {
				log(formatString(SUITE_START, topLevelSuite, flowId));
			}
			return;
		}
		suite.startDate = new Date();
		log(formatString(SUITE_START, suite.title, flowId));
	});

	runner.on('test', function (test) {
		log(formatString(TEST_START, test.title, flowId));
	});

	runner.on('fail', function (test, err) {
		log(formatString(TEST_FAILED, test.title, err.message, err.stack, flowId));
	});

	runner.on('pending', function (test) {
		log(formatString(TEST_IGNORED, test.title, test.title, flowId));
	});

	runner.on('test end', function (test) {
		log(formatString(TEST_END, test.title, test.duration, flowId));
	});

	runner.on('suite end', function (suite) {
		if (suite.root) return;
		log(formatString(SUITE_END, suite.title, new Date() - suite.startDate, flowId));
	});

	runner.on('end', function () {
		if (topLevelSuite) {
			log(formatString(SUITE_END, topLevelSuite, stats.duration, flowId));
		}
		log(formatString(SUITE_END, 'mocha.suite', stats.duration, flowId));
	});
}

if (typeof window == 'undefined') {
	exports = module.exports = Teamcity;
} else {

}