const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/
  });
  
  module.exports = withMDX({
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
    images: {
      domains: ['placekitten.com'] // Add the domain(s) from which you're loading images
    }
  });
  