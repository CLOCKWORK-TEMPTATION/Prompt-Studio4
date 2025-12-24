import type { PlaygroundExample } from '../types';

export const playgroundExamples: PlaygroundExample[] = [
  {
    title: 'Blog Post Outline',
    userInput: 'An outline for a blog post about the benefits of remote work.',
    customInstructions: 'The outline should have an introduction, at least 3 main points with sub-points, and a conclusion. The tone should be professional but engaging for a corporate audience.'
  },
  {
    title: 'Social Media Ad Copy',
    userInput: 'Ad copy for a new brand of eco-friendly coffee.',
    customInstructions: 'Generate 3 variations. Each variation should be short, catchy, and under 150 characters. Highlight the sustainable sourcing and rich flavor. Include a call-to-action to "Shop Now".'
  },
  {
    title: 'Python Function Docstring',
    userInput: 'A Python function that calculates the factorial of a number.',
    customInstructions: 'Generate a complete docstring for the function. It must follow the Google Python Style Guide for docstrings, including sections for Args, Returns, and Raises (for negative input).'
  },
  {
    title: 'Meal Plan Idea',
    userInput: 'A healthy meal plan for a week.',
    customInstructions: 'Create a 3-day vegetarian meal plan (Breakfast, Lunch, Dinner). The meals should be easy to prepare (under 30 minutes) and use common ingredients. Output the result in a Markdown table.'
  }
];
