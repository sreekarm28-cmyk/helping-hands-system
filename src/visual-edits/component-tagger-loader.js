// Minimal passthrough loader used when the original Orchid visual-edit
// component-tagger loader isn't present. Returning the source unchanged
// avoids Turbopack/Next build errors when the project was copied without
// the visual editor files.

module.exports = function componentTaggerLoader(source) {
  return source;
};

// Support the loader being used in async mode as well.
module.exports.raw = false;
