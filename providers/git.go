package providers

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

var InvalidBranchError = errors.New("The currently checked out branch does not match the requested branch. Please checkout the correct branch first.")
var InvalidStateError = errors.New("The GitProvider is not in a valid state. Fix the issues or continue without Git data.")

// NOTE: GitProvider does not open the files, it can only
// - clone the repo, given an URL
// - pull the repo, given a path
// In case of success in either case it updates the commit hash and date and closes the repo again.
// The Files are opened  and serialized by the FSProvider, which operates on the same file path.
type GitProvider struct {
	URL    string
	Path   string
	Branch string
	Commit string
	Date   time.Time
}

func NewGitProvider(url string, path string, branch string) *GitProvider {
	if branch == "" || url == "" || path == "" {
		return nil
	}
	return &GitProvider{URL: url, Path: path, Branch: branch}
}

func (g *GitProvider) Pull() error {
	branch := plumbing.NewBranchReferenceName(g.Branch)
	repo, err := git.PlainOpen(g.Path)
	if err != nil {
		return err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return err
	}

	if err := wt.Checkout(&git.CheckoutOptions{
		Branch: branch,
		Force:  true,
	}); err != nil {
		return err
	}

	if err := wt.Pull(&git.PullOptions{
		RemoteName:    "origin",
		ReferenceName: branch,
		Progress:      os.Stdout,
	}); err != nil && err != git.NoErrAlreadyUpToDate {
		return err
	}
	defer wt.Clean(&git.CleanOptions{Dir: true})

	return g.setValues(repo)
}

func (g *GitProvider) Clone() error {
	branch := plumbing.NewBranchReferenceName(g.Branch)

	repo, err := git.PlainClone(g.Path, false, &git.CloneOptions{
		URL:           g.URL,
		Progress:      os.Stdout,
		SingleBranch:  true,
		ReferenceName: branch,
		Depth:         1,
	})

	if err != nil {
		return err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return err
	}
	defer wt.Clean(&git.CleanOptions{Dir: true})

	if err := wt.Checkout(&git.CheckoutOptions{
		Branch: branch,
		Force:  true,
	}); err != nil {
		return err
	}

	return g.setValues(repo)
}

// Implement String Interface
func (g *GitProvider) String() string {
	return fmt.Sprintf("GitProvider{URL: %s, Path: %s, Branch: %s, Commit: %s, Date: %s}", g.URL, g.Path, g.Branch, g.Commit, g.Date)
}

func (g *GitProvider) setValues(repo *git.Repository) error {
	log, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return err
	}
	defer log.Close()

	commit, err := log.Next()
	if err != nil {
		return err
	}

	g.Commit = commit.Hash.String()
	g.Date = commit.Author.When

	return err
}

func (g *GitProvider) Read() error {
	repo, err := git.PlainOpen(g.Path)
	if err != nil {
		return err
	}

	head, err := repo.Head()
	if err != nil {
		return err
	}

	cbranch := head.Name().Short()
	if cbranch != g.Branch {
		return InvalidBranchError
	}

	return g.setValues(repo)
}

func (g *GitProvider) Validate() error {
	if g.Commit == "" || g.Date.IsZero() {
		return InvalidStateError
	}
	return nil
}
